import { courses as seedCourses, students as seedStudents } from "../data/mockData";
import { deriveInstructorEmail } from "../domain/instructor";
import { mockInstructorApplications, mockStudentApplications } from "./mockAdmissionsSeed";

const CLEANUP_KEY = "college0.cleanup.giovanni-carrion-last-custom-course.v1";
const DEMO_SCRUB_KEY = "college0.cleanup.demo-temp-people.v1";
const TARGET_NAME = "giovanni carrion";
const COURSE_STORAGE_KEY = "college0.courses.v2";
const SEED_COURSE_IDS = new Set(seedCourses.map((course) => course.id));
const SEED_STUDENT_EMAILS = new Set(seedStudents.map((student) => normalize(student.email)));
const SEED_INSTRUCTOR_EMAILS = new Set(seedCourses.map((course) => deriveInstructorEmail(course.instructor)));
const SEED_STUDENT_APPLICATION_EMAILS = new Set(mockStudentApplications.map((application) => normalize(application.email)));
const SEED_INSTRUCTOR_APPLICATION_EMAILS = new Set(mockInstructorApplications.map((application) => normalize(application.email)));

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

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesGiovanni(record: { name?: string; applicantName?: string; email?: string }) {
  const name = normalize(record.name ?? record.applicantName);
  const email = normalize(record.email);
  return name === TARGET_NAME || email.includes("giovanni") || email.includes("carrion");
}

function collectGiovanniEmails() {
  const emails = new Set<string>();
  const profiles = readJson<Array<{ name?: string; email?: string }>>("college0.academics.studentProfiles", []);
  const credentials = readJson<Array<{ name?: string; email?: string }>>("college0.auth.credentials", []);
  const applications = readJson<Array<{ applicantName?: string; email?: string }>>("college0.admissions.studentApplications", []);

  [...profiles, ...credentials, ...applications].forEach((record) => {
    if (matchesGiovanni(record) && record.email) {
      emails.add(normalize(record.email));
    }
  });

  return emails;
}

function removeGiovanniCarrion() {
  const emails = collectGiovanniEmails();

  const profiles = readJson<Array<{ name?: string; email?: string }>>("college0.academics.studentProfiles", []);
  writeJson(
    "college0.academics.studentProfiles",
    profiles.filter((profile) => !matchesGiovanni(profile) && !emails.has(normalize(profile.email))),
  );

  const snapshots = readJson<Record<string, unknown>>("college0.academics.studentCourseSnapshots", {});
  const nextSnapshots = { ...snapshots };
  emails.forEach((email) => delete nextSnapshots[email]);
  writeJson("college0.academics.studentCourseSnapshots", nextSnapshots);

  const credentials = readJson<Array<{ name?: string; email?: string }>>("college0.auth.credentials", []);
  writeJson(
    "college0.auth.credentials",
    credentials.filter((credential) => !matchesGiovanni(credential) && !emails.has(normalize(credential.email))),
  );

  const removedCredentials = readJson<string[]>("college0.auth.removedCredentials", []);
  writeJson("college0.auth.removedCredentials", Array.from(new Set([...removedCredentials, ...emails])));

  const session = readJson<{ email?: string } | null>("college0.auth.session", null);
  if (session?.email && emails.has(normalize(session.email))) {
    window.localStorage.removeItem("college0.auth.session");
  }

  const applications = readJson<Array<{ id?: string; applicantName?: string; email?: string }>>(
    "college0.admissions.studentApplications",
    [],
  );
  const removedApplicationIds = new Set(
    applications
      .filter((application) => matchesGiovanni(application) || emails.has(normalize(application.email)))
      .map((application) => application.id)
      .filter(Boolean),
  );
  writeJson(
    "college0.admissions.studentApplications",
    applications.filter((application) => !removedApplicationIds.has(application.id) && !emails.has(normalize(application.email))),
  );

  const admissionsCredentials = readJson<Array<{ studentApplicationId?: string }>>("college0.admissions.credentials", []);
  writeJson(
    "college0.admissions.credentials",
    admissionsCredentials.filter((credential) => !removedApplicationIds.has(credential.studentApplicationId)),
  );

  const warnings = readJson<Array<{ subjectId?: string }>>("college0.warnings", []);
  writeJson("college0.warnings", warnings.filter((warning) => !emails.has(normalize(warning.subjectId))));

  const grades = readJson<Array<{ studentEmail?: string }>>("college0.grades", []);
  writeJson("college0.grades", grades.filter((grade) => !emails.has(normalize(grade.studentEmail))));

  const reviews = readJson<Array<{ studentEmail?: string }>>("college0.reviews", []);
  writeJson("college0.reviews", reviews.filter((review) => !emails.has(normalize(review.studentEmail))));

  const phaseState = readJson<Record<string, unknown>>("college0.phaseState", {});
  writeJson("college0.phaseState", {
    ...phaseState,
    specialReregEligible: (phaseState.specialReregEligible as string[] | undefined)?.filter((email) => !emails.has(normalize(email))) ?? [],
    suspendedStudents:
      (phaseState.suspendedStudents as Array<{ studentEmail?: string }> | undefined)?.filter(
        (record) => !emails.has(normalize(record.studentEmail)),
      ) ?? [],
    registrarFines:
      (phaseState.registrarFines as Array<{ studentEmail?: string }> | undefined)?.filter(
        (record) => !emails.has(normalize(record.studentEmail)),
      ) ?? [],
    terminatedStudents: (phaseState.terminatedStudents as string[] | undefined)?.filter((email) => !emails.has(normalize(email))) ?? [],
    honorRollStudents: (phaseState.honorRollStudents as string[] | undefined)?.filter((email) => !emails.has(normalize(email))) ?? [],
    graduatedStudents: (phaseState.graduatedStudents as string[] | undefined)?.filter((email) => !emails.has(normalize(email))) ?? [],
  });
}

function removeLastCustomCourse() {
  const courses = readJson<Array<{ id: string; enrolledStudentIds?: string[]; waitlistStudentIds?: string[] }>>(COURSE_STORAGE_KEY, []);
  const lastCustomCourse = [...courses].reverse().find((course) => course.id && !SEED_COURSE_IDS.has(course.id));
  if (!lastCustomCourse) return;

  const courseId = lastCustomCourse.id;
  writeJson(COURSE_STORAGE_KEY, courses.filter((course) => course.id !== courseId));

  const assignments = readJson<Record<string, string[]>>("college0.academics.instructorAssignments", {});
  writeJson(
    "college0.academics.instructorAssignments",
    Object.fromEntries(
      Object.entries(assignments).map(([email, courseIds]) => [email, courseIds.filter((id) => id !== courseId)]),
    ),
  );

  const reviews = readJson<Array<{ courseId?: string }>>("college0.reviews", []);
  writeJson("college0.reviews", reviews.filter((review) => review.courseId !== courseId));

  const grades = readJson<Array<{ courseId?: string }>>("college0.grades", []);
  writeJson("college0.grades", grades.filter((grade) => grade.courseId !== courseId));

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith("college0.registration.plannedSchedule:")) continue;
    const plannedIds = readJson<string[]>(key, []);
    writeJson(key, plannedIds.filter((id) => id !== courseId));
  }
}

function collectNonSeedStudentEmails() {
  const emails = new Set<string>();
  const profiles = readJson<Array<{ email?: string }>>("college0.academics.studentProfiles", []);
  const credentials = readJson<Array<{ email?: string; role?: string }>>("college0.auth.credentials", []);
  const applications = readJson<Array<{ email?: string }>>("college0.admissions.studentApplications", []);

  profiles.forEach((profile) => {
    const email = normalize(profile.email);
    if (email && !SEED_STUDENT_EMAILS.has(email)) emails.add(email);
  });
  credentials.forEach((credential) => {
    const email = normalize(credential.email);
    if (credential.role === "student" && email && !SEED_STUDENT_EMAILS.has(email)) emails.add(email);
  });
  applications.forEach((application) => {
    const email = normalize(application.email);
    if (email && !SEED_STUDENT_APPLICATION_EMAILS.has(email)) emails.add(email);
  });

  return emails;
}

function collectNonSeedInstructorEmails() {
  const emails = new Set<string>();
  const credentials = readJson<Array<{ email?: string; role?: string }>>("college0.auth.credentials", []);
  const applications = readJson<Array<{ email?: string }>>("college0.admissions.instructorApplications", []);
  const assignments = readJson<Record<string, string[]>>("college0.academics.instructorAssignments", {});

  credentials.forEach((credential) => {
    const email = normalize(credential.email);
    if (credential.role === "instructor" && email && !SEED_INSTRUCTOR_EMAILS.has(email)) emails.add(email);
  });
  applications.forEach((application) => {
    const email = normalize(application.email);
    if (email && !SEED_INSTRUCTOR_APPLICATION_EMAILS.has(email)) emails.add(email);
  });
  Object.keys(assignments).forEach((email) => {
    const normalized = normalize(email);
    if (normalized && !SEED_INSTRUCTOR_EMAILS.has(normalized)) emails.add(normalized);
  });

  return emails;
}

function removeTemporaryDemoPeople() {
  const studentEmails = collectNonSeedStudentEmails();
  const instructorEmails = collectNonSeedInstructorEmails();

  const studentApplications = readJson<Array<{ email?: string }>>("college0.admissions.studentApplications", mockStudentApplications);
  writeJson(
    "college0.admissions.studentApplications",
    studentApplications.filter((application) => SEED_STUDENT_APPLICATION_EMAILS.has(normalize(application.email))),
  );

  const instructorApplications = readJson<Array<{ email?: string }>>("college0.admissions.instructorApplications", mockInstructorApplications);
  writeJson(
    "college0.admissions.instructorApplications",
    instructorApplications.filter((application) => SEED_INSTRUCTOR_APPLICATION_EMAILS.has(normalize(application.email))),
  );

  const profiles = readJson<Array<{ email?: string }>>("college0.academics.studentProfiles", []);
  writeJson(
    "college0.academics.studentProfiles",
    profiles.filter((profile) => !studentEmails.has(normalize(profile.email))),
  );

  const credentials = readJson<Array<{ email?: string; role?: string }>>("college0.auth.credentials", []);
  writeJson(
    "college0.auth.credentials",
    credentials.filter((credential) => {
      const email = normalize(credential.email);
      return !studentEmails.has(email) && !instructorEmails.has(email);
    }),
  );

  const removedCredentials = readJson<string[]>("college0.auth.removedCredentials", []);
  writeJson(
    "college0.auth.removedCredentials",
    Array.from(new Set([...removedCredentials, ...studentEmails, ...instructorEmails])),
  );

  const assignments = readJson<Record<string, string[]>>("college0.academics.instructorAssignments", {});
  writeJson(
    "college0.academics.instructorAssignments",
    Object.fromEntries(Object.entries(assignments).filter(([email]) => !instructorEmails.has(normalize(email)))),
  );

  const snapshots = readJson<Record<string, unknown>>("college0.academics.studentCourseSnapshots", {});
  const nextSnapshots = { ...snapshots };
  studentEmails.forEach((email) => delete nextSnapshots[email]);
  writeJson("college0.academics.studentCourseSnapshots", nextSnapshots);

  const admissionsCredentials = readJson<Array<{ studentEmail?: string; instructorEmail?: string }>>("college0.admissions.credentials", []);
  writeJson(
    "college0.admissions.credentials",
    admissionsCredentials.filter(
      (credential) =>
        !studentEmails.has(normalize(credential.studentEmail)) &&
        !instructorEmails.has(normalize(credential.instructorEmail)),
    ),
  );

  const warnings = readJson<Array<{ subjectId?: string }>>("college0.warnings", []);
  writeJson(
    "college0.warnings",
    warnings.filter((warning) => {
      const subjectId = normalize(warning.subjectId);
      return !studentEmails.has(subjectId) && !instructorEmails.has(subjectId);
    }),
  );

  const grades = readJson<Array<{ studentEmail?: string; enteredBy?: string }>>("college0.grades", []);
  writeJson(
    "college0.grades",
    grades.filter(
      (grade) =>
        !studentEmails.has(normalize(grade.studentEmail)) &&
        !instructorEmails.has(normalize(grade.enteredBy)),
    ),
  );

  const reviews = readJson<Array<{ studentEmail?: string }>>("college0.reviews", []);
  writeJson("college0.reviews", reviews.filter((review) => !studentEmails.has(normalize(review.studentEmail))));

  const complaints = readJson<Array<{ filedByEmail?: string; filedAgainstEmail?: string }>>("college0.complaints", []);
  writeJson(
    "college0.complaints",
    complaints.filter((complaint) => {
      const filedBy = normalize(complaint.filedByEmail);
      const filedAgainst = normalize(complaint.filedAgainstEmail);
      return (
        !studentEmails.has(filedBy) &&
        !studentEmails.has(filedAgainst) &&
        !instructorEmails.has(filedBy) &&
        !instructorEmails.has(filedAgainst)
      );
    }),
  );

  const phaseState = readJson<Record<string, unknown>>("college0.phaseState", {});
  writeJson("college0.phaseState", {
    ...phaseState,
    specialReregEligible: (phaseState.specialReregEligible as string[] | undefined)?.filter((email) => !studentEmails.has(normalize(email))) ?? [],
    suspendedStudents:
      (phaseState.suspendedStudents as Array<{ studentEmail?: string }> | undefined)?.filter(
        (record) => !studentEmails.has(normalize(record.studentEmail)),
      ) ?? [],
    registrarFines:
      (phaseState.registrarFines as Array<{ studentEmail?: string }> | undefined)?.filter(
        (record) => !studentEmails.has(normalize(record.studentEmail)),
      ) ?? [],
    terminatedStudents: (phaseState.terminatedStudents as string[] | undefined)?.filter((email) => !studentEmails.has(normalize(email))) ?? [],
    honorRollStudents: (phaseState.honorRollStudents as string[] | undefined)?.filter((email) => !studentEmails.has(normalize(email))) ?? [],
    graduatedStudents: (phaseState.graduatedStudents as string[] | undefined)?.filter((email) => !studentEmails.has(normalize(email))) ?? [],
    instructorsMissingGrades:
      (phaseState.instructorsMissingGrades as string[] | undefined)?.filter((email) => !instructorEmails.has(normalize(email))) ?? [],
  });

  const session = readJson<{ email?: string } | null>("college0.auth.session", null);
  const sessionEmail = normalize(session?.email);
  if (studentEmails.has(sessionEmail) || instructorEmails.has(sessionEmail)) {
    window.localStorage.removeItem("college0.auth.session");
  }
}

export function runPrototypeCleanup() {
  if (!hasBrowserStorage()) return;

  let changed = false;

  if (!window.localStorage.getItem(CLEANUP_KEY)) {
    removeGiovanniCarrion();
    removeLastCustomCourse();
    window.localStorage.setItem(CLEANUP_KEY, new Date().toISOString());
    changed = true;
  }

  if (!window.localStorage.getItem(DEMO_SCRUB_KEY)) {
    removeTemporaryDemoPeople();
    window.localStorage.setItem(DEMO_SCRUB_KEY, new Date().toISOString());
    changed = true;
  }

  if (changed) {
    window.dispatchEvent(new CustomEvent("college0:courses:changed"));
    window.dispatchEvent(new CustomEvent("college0:reviews:changed"));
    window.dispatchEvent(new CustomEvent("college0:grades:changed"));
    window.dispatchEvent(new CustomEvent("college0:phaseState:changed"));
    window.dispatchEvent(new CustomEvent("college0:complaints:changed"));
  }
}
