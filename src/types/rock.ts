// FILE: src/types/rock.ts

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
  dueDate?: string;
  completed: boolean;
};

export type WeeklyUpdate = {
  id: string;
  date: string; // YYYY-MM-DD
  status: RockStatus;
  notes?: string;
};

export type Rock = {
  id: string;

  companyId: string;
  ownerId: string;

  title: string;
  finalStatement: string;

  draft: string;

  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;

  dueDate: string; // YYYY-MM-DD
  status: RockStatus;

  metrics: Metric[];
  milestones: Milestone[];

  weeklyUpdates?: WeeklyUpdate[];

  createdAt?: unknown;
  updatedAt?: unknown;

  // NOTE: archived is intentionally not part of the type.
};
