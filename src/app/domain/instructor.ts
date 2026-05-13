export function deriveInstructorEmail(instructorName: string): string {
  return instructorName
    .replace(/^Dr\. |^Prof\. /, "")
    .toLowerCase()
    .replace(/\s+/g, ".")
    .concat("@college0.edu");
}
