export const GRADE_OPTIONS = [
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
] as const;

export type LetterGrade = (typeof GRADE_OPTIONS)[number];

const GRADE_POINTS: Record<LetterGrade, number> = {
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

export function isLetterGrade(value: string): value is LetterGrade {
  return value in GRADE_POINTS;
}

export function gradeToPoints(grade: string): number {
  return GRADE_POINTS[grade as LetterGrade] ?? 0;
}

export interface GradeEntryForGpa {
  grade: string;
  credits: number;
}

export function computeGpa(entries: GradeEntryForGpa[]): number {
  if (entries.length === 0) return 0;
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credits, 0);
  if (totalCredits === 0) return 0;
  const totalWeightedPoints = entries.reduce(
    (sum, entry) => sum + gradeToPoints(entry.grade) * entry.credits,
    0,
  );
  return totalWeightedPoints / totalCredits;
}
