/* ============================================================
   FILE: src/types/rock.ts

   SCOPE:
   Rock domain types (CHARTER SCRUB — FINAL)
   - Canonical Firestore model:
       rocks/{rockId} with `userId` owner field
   - Supports current UI shape (RockBuilder)
   - Supports legacy fields safely
   ============================================================ */

export type RockStatus = "on_track" | "off_track" | "done";

export type Metric = {
  id: string;
  name: string;
  target: string;
  current?: string;
};

export type Milestone = {
  id: string;
  text: string;
  dueDate?: string; // YYYY-MM-DD (optional)
  completed: boolean;
};

export type WeeklyUpdate = {
  id: string;
  date: string; // YYYY-MM-DD
  status: RockStatus;
  notes?: string;
};

export type SmartFields = {
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timebound?: string; // matches RockBuilder usage
};

export type Rock = {
  id: string;

  /* --------------------------------
     Ownership / scoping
     -------------------------------- */
  userId: string; // ✅ canonical owner field used by Firestore queries

  // Legacy compatibility (do not rely on these for new code)
  ownerId?: string;
  companyId?: string;

  /* --------------------------------
     Core text
     -------------------------------- */
  title: string;

  // Draft inputs (we allow both; UI uses statement in places)
  draft?: string;
  statement?: string;

  // Final shareable statement
  finalStatement?: string;

  /* --------------------------------
     SMART coaching
     -------------------------------- */
  smart?: SmartFields;

  // Legacy compatibility (older flat SMART fields)
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBound?: string;

  /* --------------------------------
     Step 3/4 text inputs (current UI)
     -------------------------------- */
  metricsText?: string;
  milestonesText?: string;

  /* --------------------------------
     Step 5 fields (current UI)
     -------------------------------- */
  suggestedImprovement?: string;

  /* --------------------------------
     Tracking
     -------------------------------- */
  dueDate?: string; // YYYY-MM-DD
  status?: RockStatus;

  // In-app arrays should always be arrays once loaded/normalized
  metrics: Metric[];
  milestones: Milestone[];
  weeklyUpdates?: WeeklyUpdate[];

  /* --------------------------------
     Flow
     -------------------------------- */
  step?: number;

  /* --------------------------------
     Timestamps
     -------------------------------- */
  createdAt?: unknown;
  updatedAt?: unknown;
};
