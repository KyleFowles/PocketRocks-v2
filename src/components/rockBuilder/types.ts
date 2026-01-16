/* ============================================================
   FILE: src/components/rockBuilder/types.ts

   SCOPE:
   Shared local types for RockBuilder orchestration.
   ============================================================ */

export type Step = 1 | 2 | 3 | 4 | 5;

export type Props = {
  uid: string;
  rockId: string;
  initialRock: any;
};

export type BannerMsg = { kind: "error" | "ok"; text: string } | null;

export type AiSuggestion = {
  id?: string;
  text?: string;
  recommended?: boolean;
};
