import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./client";
import type { VoteDoc } from "./types";

export function useVoteTally(declarationId: string) {
  const [tally, setTally] = useState({ voters: 0, points: 0 });

  useEffect(() => {
    return onSnapshot(
      collection(db, "declarations", declarationId, "votes"),
      (snapshot) => {
        let points = 0;
        snapshot.forEach((voteDoc) => {
          const vote = voteDoc.data() as VoteDoc;
          if (vote.known) points += 1;
          if (vote.emotion) points += 1;
        });
        setTally({ voters: snapshot.size, points });
      },
    );
  }, [declarationId]);

  return tally;
}
