export type WarningSubjectRole = "student" | "instructor";
export type WarningSeverity = 1 | 2;

export interface WarningRecord {
  id: string;
  subjectId: string;
  subjectRole: WarningSubjectRole;
  severity: WarningSeverity;
  reason: string;
  source: string;
  issuedAt: string;
  clearedBy?: string;
  clearedAt?: string;
}

export interface WarningIssueInput {
  subjectId: string;
  subjectRole: WarningSubjectRole;
  severity: WarningSeverity;
  reason: string;
  source: string;
}

const STORAGE_KEY = "college0.warnings";

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasBrowserStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function nowIsoDate() {
  return new Date().toISOString();
}

function createId() {
  return `warn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSubject(subjectId: string) {
  return subjectId.trim().toLowerCase();
}

function readAll(): WarningRecord[] {
  return readJson<WarningRecord[]>(STORAGE_KEY, []);
}

function writeAll(records: WarningRecord[]) {
  writeJson(STORAGE_KEY, records);
}

export const localWarningsRepository = {
  issue(input: WarningIssueInput): WarningRecord {
    const record: WarningRecord = {
      id: createId(),
      subjectId: normalizeSubject(input.subjectId),
      subjectRole: input.subjectRole,
      severity: input.severity,
      reason: input.reason,
      source: input.source,
      issuedAt: nowIsoDate(),
    };
    writeAll([...readAll(), record]);

    // Future Supabase handoff:
    // insert into a `warnings` table with the same schema.
    return record;
  },

  listActive(subjectId: string): WarningRecord[] {
    const target = normalizeSubject(subjectId);
    return readAll().filter((entry) => entry.subjectId === target && !entry.clearedAt);
  },

  listAll(subjectId: string): WarningRecord[] {
    const target = normalizeSubject(subjectId);
    return readAll().filter((entry) => entry.subjectId === target);
  },

  weight(subjectId: string): number {
    return localWarningsRepository
      .listActive(subjectId)
      .reduce((total, entry) => total + entry.severity, 0);
  },

  clearOneWithHonor(subjectId: string, honorId: string): WarningRecord | null {
    const target = normalizeSubject(subjectId);
    const all = readAll();
    const oldest = all
      .filter((entry) => entry.subjectId === target && !entry.clearedAt)
      .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))[0];

    if (!oldest) return null;

    const cleared: WarningRecord = {
      ...oldest,
      clearedBy: honorId,
      clearedAt: nowIsoDate(),
    };

    writeAll(all.map((entry) => (entry.id === cleared.id ? cleared : entry)));

    // Future Supabase handoff:
    // mark the row's cleared_by / cleared_at fields rather than deleting it.
    return cleared;
  },

  removeAll(subjectId: string) {
    const target = normalizeSubject(subjectId);
    writeAll(readAll().filter((entry) => entry.subjectId !== target));

    // Future Supabase handoff:
    // bulk-delete by subject on termination/suspension reset.
  },
};
