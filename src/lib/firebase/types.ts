import type { Timestamp } from "firebase/firestore";

export interface UserDoc {
  firstName: string;
  lastName: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: Timestamp;
}

export interface DeclarationDoc {
  celebrityName: string;
  declaredBy: string;
  createdAt: Timestamp;
  wikipediaUrl: string | null;
}

export interface VoteDoc {
  voterId: string;
  // Dénormalisé depuis la déclaration au moment du vote, pour afficher le
  // récap "points donnés" d'un joueur sans requête supplémentaire par vote.
  celebrityName: string;
  known: boolean;
  emotion: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
