/**
 * deriveStarterStatus.ts
 *
 * Shared helper used by both the manual import script (scripts/importplayers.ts)
 * and the API sync route (app/api/update-player-values/route.ts) to compute a
 * player's starter_status from raw Sleeper API data.
 *
 * Rules (in priority order):
 *   1. No team, team = FA/FREE AGENT, or active !== true  → INACTIVE
 *   2. Sleeper `status` is RETIRED / INACTIVE / PUP / NFI → INACTIVE
 *   3. depth_chart_order === 1                             → STARTER
 *   4. depth_chart_order >= 2                             → BACKUP
 *   5. depth_chart_order is null/undefined                → BACKUP (never default to STARTER)
 *
 * Fantasy-relevant positions (QB / RB / WR / TE) follow the same rules.
 * Non-fantasy positions (OL, DL, DB, LB, K, P, LS, etc.) will naturally
 * resolve to BACKUP or INACTIVE since they rarely have depth_chart_order = 1
 * in Sleeper, and their starter_status has no impact on dynasty trade values.
 */

export type StarterStatusValue = "STARTER" | "BACKUP" | "INACTIVE";

/** Statuses Sleeper uses that definitively mean the player is not active */
const INACTIVE_STATUSES = new Set([
  "RETIRED",
  "INACTIVE",
  "NON-FOOTBALL ILLNESS",
  "NON-FOOTBALL INJURY",
  "PHYSICALLY UNABLE TO PERFORM",
  "PUP",
  "NFI",
  "SUSPENDED",
  "EXEMPT",
]);

/**
 * Derive the correct starter_status from a raw Sleeper player object.
 * Safe to call from both Node scripts and Next.js API routes.
 */
export function deriveStarterStatus(p: Record<string, any>): StarterStatusValue {
  // ── Rule 1: Must have a real, active NFL team assignment ──────────────────
  if (!p.team) return "INACTIVE";
  const team = String(p.team).trim().toUpperCase();
  if (team === "" || team === "FA" || team === "FREE AGENT") return "INACTIVE";

  // ── Rule 1b: Must be flagged active by Sleeper ────────────────────────────
  if (p.active !== true) return "INACTIVE";

  // ── Rule 2: Explicit retirement / inactivity status ───────────────────────
  if (p.status) {
    const sleeperStatus = String(p.status).trim().toUpperCase();
    if (INACTIVE_STATUSES.has(sleeperStatus)) return "INACTIVE";
  }

  // ── Rules 3 / 4 / 5: depth_chart_order is the authoritative signal ────────
  const depthOrder = p.depth_chart_order;

  if (depthOrder === null || depthOrder === undefined) {
    // No depth chart entry → player is on roster but not a named starter.
    // Default to BACKUP — never to STARTER.
    return "BACKUP";
  }

  const order = Number(depthOrder);
  if (Number.isNaN(order)) return "BACKUP";

  // depth_chart_order === 1 is the unambiguous #1 / starter slot.
  return order === 1 ? "STARTER" : "BACKUP";
}
