// types/rock.ts

export type RockStatus = "on_track" | "off_track";

export type Metric = {
  id: string;
  name: string;
  target: string;
  current?: string;
};

export type Milestone = {
  id: string;
  text: string;
  dueDate?: string; // ISO date optional
  completed: boolean;
};

export type WeeklyUpdate = {
  id: string;
  weekDate: string; // ISO date
  status: RockStatus;
  notes: string;
};

export type Rock = {
  id: string;
  companyId: string;
  ownerId: string;

  title: string;
  finalStatement: string;

  // SMART detail fields (stored directly for MVP simplicity)
  draft: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;

  dueDate: string; // ISO date (YYYY-MM-DD)
  status: RockStatus;

  metrics: Metric[];
  milestones: Milestone[];

  // optional (we’ll add weekly updates later)
  weeklyUpdates?: WeeklyUpdate[];

  updatedAt?: any;
  createdAt?: any;
};
