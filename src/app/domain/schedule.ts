export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type DayOfWeek = (typeof WEEKDAYS)[number];

export interface CourseSchedule {
  days: DayOfWeek[];
  startMinutes: number;
  endMinutes: number;
}

export function isValidSchedule(schedule: CourseSchedule): boolean {
  if (schedule.days.length === 0) return false;
  if (!Number.isInteger(schedule.startMinutes) || !Number.isInteger(schedule.endMinutes)) return false;
  if (schedule.startMinutes < 0 || schedule.endMinutes > 24 * 60) return false;
  return schedule.startMinutes < schedule.endMinutes;
}

export function schedulesConflict(a: CourseSchedule, b: CourseSchedule): boolean {
  const sharedDay = a.days.some((day) => b.days.includes(day));
  if (!sharedDay) return false;
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

export function formatSchedule(schedule: CourseSchedule): string {
  if (!isValidSchedule(schedule)) return "Unscheduled";
  return `${schedule.days.join("/")} ${formatMinutes(schedule.startMinutes)}-${formatMinutes(schedule.endMinutes)}`;
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = ((hours + 11) % 12) + 1;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function minutesToTimeInput(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseTimeInputToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}
