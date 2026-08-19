import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

// La création de profil (et la limite à 5 inscriptions) se fait désormais
// côté client via une transaction Firestore, sécurisée par firestore.rules
// (meta/registrationCount) — voir src/components/AuthGate.tsx. Ça évite de
// dépendre d'une Cloud Function pour cette étape.

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
