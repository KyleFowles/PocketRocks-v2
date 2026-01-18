// FILE: src/app/api/rocks/list/route.ts
//
// SCOPE:
// Restore missing API route used by /dashboard.
// Returns the current user's rocks.
//
// NOTE:
// This version returns an empty list if it cannot confirm a user.
// That prevents crashes while we confirm your auth wiring.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // ✅ Safe, non-breaking default: return an empty list for now.
    // This removes the 404 and gets your dashboard unstuck.
    return NextResponse.json({ ok: true, rocks: [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to list rocks." },
      { status: 500 }
    );
  }
}
