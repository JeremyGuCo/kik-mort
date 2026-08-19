import * as admin from "firebase-admin";
import * as authV1 from "firebase-functions/v1";
import { HttpsError, onCall } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

// Groupe d'amis fermé pour l'instant : au-delà de ce nombre de comptes,
// plus personne ne peut s'inscrire (la connexion des comptes existants
// reste possible, eux ont déjà un profil).
const MAX_USERS = 5;

// ============================================================================
// onUserCreate — équivalent du trigger SQL handle_new_user().
// Crée automatiquement le profil Firestore à l'inscription Firebase Auth,
// sauf si le quota de comptes est déjà atteint : dans ce cas, aucun profil
// n'est créé et le compte Auth reste orphelin — les règles Firestore
// exigent un profil pour écrire quoi que ce soit, donc ce compte ne peut
// rien faire dans l'app.
// (Les triggers Auth n'existent qu'en 1ère génération de Cloud Functions.)
// ============================================================================
export const onUserCreate = authV1.auth.user().onCreate(async (user) => {
  const usersRef = db.collection("users");

  await db.runTransaction(async (tx) => {
    const countSnap = await tx.get(usersRef.count());
    if (countSnap.data().count >= MAX_USERS) {
      return;
    }

    const username =
      user.displayName ?? user.email?.split("@")[0] ?? `joueur-${user.uid.slice(0, 6)}`;

    tx.set(db.doc(`users/${user.uid}`), {
      username,
      avatarUrl: user.photoURL ?? null,
      totalScore: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
});

// ============================================================================
// closeDeclaration — équivalent de la fonction SQL close_declaration().
// Seul le déclarant peut clôturer sa déclaration ; le score est calculé
// côté serveur (Admin SDK, hors règles de sécurité client) en sommant les
// votes, ce qui empêche un joueur de s'auto-attribuer des points.
// ============================================================================
export const closeDeclaration = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentification requise.");
  }

  const declarationId = request.data?.declarationId;
  if (typeof declarationId !== "string" || declarationId.length === 0) {
    throw new HttpsError("invalid-argument", "declarationId manquant.");
  }

  const declarationRef = db.doc(`declarations/${declarationId}`);

  return db.runTransaction(async (tx) => {
    const declarationSnap = await tx.get(declarationRef);
    if (!declarationSnap.exists) {
      throw new HttpsError("not-found", "Déclaration introuvable.");
    }

    const declaration = declarationSnap.data()!;

    if (declaration.declaredBy !== uid) {
      throw new HttpsError(
        "permission-denied",
        "Seul le déclarant peut clôturer cette déclaration.",
      );
    }

    if (declaration.status === "closed") {
      return { status: "closed", scoreAwarded: declaration.scoreAwarded as number };
    }

    // Les sous-collections ne sont pas transactionnelles côté lecture au
    // même titre qu'un doc, mais une lecture dans la transaction garantit
    // la cohérence avec les écritures qui suivent.
    const votesSnap = await tx.get(declarationRef.collection("votes"));
    let scoreAwarded = 0;
    votesSnap.forEach((voteDoc) => {
      const vote = voteDoc.data();
      if (vote.known) scoreAwarded += 1;
      if (vote.emotion) scoreAwarded += 1;
    });

    tx.update(declarationRef, {
      status: "closed",
      scoreAwarded,
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.update(db.doc(`users/${uid}`), {
      totalScore: admin.firestore.FieldValue.increment(scoreAwarded),
    });

    return { status: "closed", scoreAwarded };
  });
});
