import type { Timestamp } from "firebase/firestore";

export type DeclarationStatus = "open" | "closed";

export interface UserDoc {
  username: string;
  avatarUrl: string | null;
  totalScore: number;
  createdAt: Timestamp;
}

export interface DeclarationDoc {
  celebrityName: string;
  declaredBy: string;
  status: DeclarationStatus;
  scoreAwarded: number | null;
  createdAt: Timestamp;
  closedAt: Timestamp | null;
  wikipediaUrl: string | null;
}

export interface VoteDoc {
  known: boolean;
  emotion: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
