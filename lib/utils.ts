import type {
  AssignmentStatus,
  DisplayStatus,
  Task,
  TaskAssignment,
} from "./types";

/** Join class names, dropping falsy values. */
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── Status ───────────────────────────────────────────────────────

/**
 * Overdue is derived, not stored (plan: Option B). A task is overdue when
 * its deadline has passed and the participant has not completed it.
 */
export function displayStatus(
  status: AssignmentStatus,
  deadline: string,
): DisplayStatus {
  if (status === "completed") return "completed";
  return new Date(deadline).getTime() < Date.now() ? "overdue" : status;
}

export function isOverdue(
  assignment: Pick<TaskAssignment, "status">,
  task: Pick<Task, "deadline">,
) {
  return displayStatus(assignment.status, task.deadline) === "overdue";
}

/** Hours until the deadline; negative once it has passed. */
export function hoursUntil(deadline: string) {
  return (new Date(deadline).getTime() - Date.now()) / 36e5;
}

/** Urgency drives colour: green on track, amber due soon, terracotta overdue. */
export function urgency(deadline: string): "ok" | "soon" | "late" {
  const h = hoursUntil(deadline);
  if (h < 0) return "late";
  if (h < 48) return "soon";
  return "ok";
}

// ── Timezone ─────────────────────────────────────────────────────
// Deadlines are anchored to the cohort's timezone (US Eastern), so "5pm"
// means the same wall-clock time for every participant no matter where the
// admin or the viewer is. Instants are still stored as UTC; only the
// wall-clock reading is pinned here.
export const COHORT_TIMEZONE = "America/New_York";

/** Offset (ms) of `timeZone` from UTC at a given instant, DST included. */
function zoneOffsetMs(instant: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(instant)) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - instant.getTime();
}

/**
 * Read a bare "YYYY-MM-DDTHH:mm" (as it would read on a clock in the cohort
 * timezone) as the matching UTC instant. A string that already carries a zone
 * (Z or ±hh:mm) is trusted as-is.
 */
export function cohortWallClockToUtcIso(wallClock: string): string {
  const s = wallClock.trim();
  if (/[Zz]$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s).toISOString();

  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return new Date(s).toISOString();

  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offset = zoneOffsetMs(new Date(guess), COHORT_TIMEZONE);
  return new Date(guess - offset).toISOString();
}

/** Inverse — render a stored UTC ISO as the cohort-timezone wall clock a
 *  datetime-local input expects. */
export function utcIsoToCohortWallClock(iso: string | null | undefined): string {
  if (!iso) return "";
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: COHORT_TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(new Date(iso))) {
    if (part.type !== "literal") p[part.type] = part.value;
  }
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// ── Dates ────────────────────────────────────────────────────────

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  // Anchored to the cohort timezone with its label ("EST"/"EDT"), so a
  // deadline reads the same for the admin in Pakistan and the US participant.
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: COHORT_TIMEZONE,
    timeZoneName: "short",
  });
}

/** "3 days ago", "in 5 hours" — used on deadlines and activity feeds. */
export function relativeTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const diffMs = new Date(value).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536e6],
    ["month", 2592e6],
    ["day", 864e5],
    ["hour", 36e5],
    ["minute", 6e4],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "just now";
}

export function isToday(value: string) {
  const d = new Date(value);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/** Which week of the cohort today falls in, clamped to 1–3. */
export function currentWeek(startDate: string, weeks = 3) {
  const elapsedDays = Math.floor(
    (Date.now() - new Date(startDate).getTime()) / 864e5,
  );
  return Math.min(Math.max(Math.floor(elapsedDays / 7) + 1, 1), weeks);
}

// ── Passwords ────────────────────────────────────────────────────

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

/** 16-char password from a CSPRNG, rejection-sampled to avoid modulo bias. */
export function generatePassword(length = 16) {
  const n = PASSWORD_ALPHABET.length;
  const limit = 256 - (256 % n); // discard values that would skew the modulo
  const out: string[] = [];

  while (out.length < length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b >= limit) continue;
      out.push(PASSWORD_ALPHABET[b % n]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}

// ── Video embeds ─────────────────────────────────────────────────

/** Normalise a Loom / YouTube / Vimeo share URL into its embed form. */
export function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
      // Shorts and live permalinks carry the id in the path instead.
      const pathId = u.pathname.match(/^\/(?:shorts|live)\/([^/?#]+)/)?.[1];
      if (pathId) return `https://www.youtube.com/embed/${pathId}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "loom.com") {
      const id = u.pathname.split("/").pop();
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return url;
    return null;
  } catch {
    return null;
  }
}

// ── CSV ──────────────────────────────────────────────────────────

function escapeCsvCell(value: unknown) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

/**
 * Split a CSV/TSV line, honouring quoted cells so a description containing
 * a comma does not get split into two columns.
 */
export function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

export function percent(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
