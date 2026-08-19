export type DeclarationStatus = "open" | "closed";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
        };
      };
      declarations: {
        Row: {
          id: string;
          celebrity_name: string;
          declared_by: string;
          status: DeclarationStatus;
          score_awarded: number | null;
          created_at: string;
          closed_at: string | null;
        };
        Insert: {
          celebrity_name: string;
          declared_by: string;
        };
        Update: never;
      };
      votes: {
        Row: {
          id: string;
          declaration_id: string;
          voter_id: string;
          known: boolean;
          emotion: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          declaration_id: string;
          voter_id: string;
          known?: boolean;
          emotion?: boolean;
        };
        Update: {
          known?: boolean;
          emotion?: boolean;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          total_score: number;
        };
      };
    };
    Functions: {
      close_declaration: {
        Args: { p_declaration_id: string };
        Returns: Database["public"]["Tables"]["declarations"]["Row"];
      };
    };
  };
}
