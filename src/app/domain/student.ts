import { students as seedStudents } from "../data/mockData";

export function resolveStudentDisplayName(email: string): string {
  const normalized = email.trim().toLowerCase();
  const match = seedStudents.find((student) => student.email.toLowerCase() === normalized);
  return match ? match.name : email;
}
