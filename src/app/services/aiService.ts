import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UserRole } from "../auth/authTypes";
import { localCollegeRepository } from "./localCollegeRepository";
import { localCourseRepository } from "./localCourseRepository";
import { formatSchedule } from "../domain/schedule";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export type AISource = "database" | "llm";
export type AIRole = UserRole | "visitor";

export interface AIResponse {
  answer: string;
  source: AISource;
  warning: boolean;
}

function buildCourseCatalog() {
  return localCourseRepository
    .list()
    .map((course) => {
      const enrolled = course.enrolledStudentIds.length;
      return `${course.id}: ${course.name} (${course.instructor}, ${formatSchedule(course.schedule)}, rating: ${course.rating}/5, ${enrolled}/${course.seats} seats)`;
    })
    .join("\n");
}

function buildRoleContext(role: AIRole, email: string, name: string): string {
  const policy = [
    "Graduation requirements: complete 8 courses, maintain at least a 2.0 GPA, and remain in good academic standing.",
    "Students should register for 2 to 4 courses during the registration period.",
    "Full courses place students on a waitlist; only the instructor can admit waitlisted students.",
    "Students may retake a course only if they previously received an F.",
    "Reviews close after the instructor posts the student's grade.",
  ].join("\n");

  let profile = "";
  if (role === "visitor") {
    profile = "User is a visitor (not logged in). Provide only publicly available information. Do not reference any personal academic records.";
  } else if (role === "student") {
    const student = localCollegeRepository.getStudentProfile({ name, email });
    const snapshot = localCollegeRepository.getStudentCourseSnapshot(email);
    const enrolled = snapshot.enrolledCourses.length
      ? snapshot.enrolledCourses.map((course) => `${course.id} ${course.name} (${course.grade})`).join(", ")
      : "none";
    const completed = snapshot.completedCourses.length
      ? snapshot.completedCourses.map((course) => `${course.id} ${course.name} (${course.grade})`).join(", ")
      : "none";

    profile = [
      `Student: ${name} (${email})`,
      `GPA: ${student.gpa}; status: ${student.status}; warnings: ${student.warnings}`,
      `Courses completed: ${student.coursesCompleted} of 8 required`,
      `Currently enrolled: ${enrolled}`,
      `Completed courses: ${completed}`,
    ].join("\n");
  } else if (role === "instructor") {
    const assignedCourses = localCollegeRepository.getInstructorCourses({ email, name });
    const roster = localCollegeRepository.getInstructorRoster(email);
    profile = [
      `Instructor: ${name} (${email})`,
      `Assigned courses: ${assignedCourses.map((course) => `${course.id} ${course.name}`).join(", ") || "none"}`,
      `Current roster: ${roster.map((student) => `${student.name} (${student.course}, grade: ${student.grade}, status: ${student.status})`).join(", ") || "none"}`,
    ].join("\n");
  } else {
    profile = `Registrar: ${name} (${email}); full administrative access to College0 records.`;
  }

  const ccny = [
    "CCNY (City College of New York) is located at 160 Convent Avenue, New York, NY 10031.",
    "Nearby food options: Ten Dragon, Amsterdam Sushi, Halal Brothers, Tajeen Halal, Burger & Shake, Suhal's Deli, Clove.",
    "Student ID and ID replacements: visit the One Stop Desk on campus.",
    "Good study spots: NAC/Cohen Library, Sheppard Library, NAC Rotunda, Marshak Library.",
    "Places to hang out on and near campus: The Hoffman, NAC Cafeteria, Wingate Hall, Dormrooms.",
    "Tutoring resources: The Artino Center and the Marshak Tutoring Center.",
  ].join("\n");

  return `COLLEGE0 LOCAL KNOWLEDGE\n\nPolicies:\n${policy}\n\nCourse catalog:\n${buildCourseCatalog()}\n\nCCNY Campus Info:\n${ccny}\n\nUser context:\n${profile}`;
}

interface LocalRule {
  keywords: string[];
  roles?: AIRole[];
  answer: (role: AIRole, email: string, name: string) => string;
}

const localRules: LocalRule[] = [
  {
    keywords: ["graduation", "graduate", "requirement", "degree", "finish", "complete"],
    answer: () =>
      "To graduate, a student must complete 8 courses, maintain at least a 2.0 GPA, and remain in good academic standing.",
  },
  {
    keywords: ["registration", "register", "enroll", "enrollment", "waitlist", "semester"],
    roles: ["student", "visitor"],
    answer: () =>
      "Students register for 2 to 4 courses during the registration period. Full classes place students on the waitlist, and the instructor controls waitlist admission.",
  },
  {
    keywords: ["what is my gpa", "show my gpa", "current gpa", "check my gpa", "view my gpa"],
    roles: ["student"],
    answer: (_, email, name) => {
      const student = localCollegeRepository.getStudentProfile({ name, email });
      return `Your current GPA is ${student.gpa}. You have completed ${student.coursesCompleted} of 8 required courses and your standing is "${student.status}."`;
    },
  },
  {
    keywords: ["warning", "suspend", "standing", "academic status", "my status"],
    roles: ["student"],
    answer: (_, email, name) => {
      const student = localCollegeRepository.getStudentProfile({ name, email });
      return `Your academic status is "${student.status}" with ${student.warnings} warning(s) on the current profile.`;
    },
  },
  {
    keywords: ["my course", "current course", "taking", "schedule", "this semester", "enrolled"],
    roles: ["student"],
    answer: (_, email) => {
      const snapshot = localCollegeRepository.getStudentCourseSnapshot(email);
      if (!snapshot.enrolledCourses.length) return "You are not currently enrolled in any courses in the local record.";
      return `You are currently enrolled in: ${snapshot.enrolledCourses.map((course) => `${course.id} ${course.name}`).join(", ")}.`;
    },
  },
  {
    keywords: ["course catalog", "courses available", "courses offered", "list courses", "what courses"],
    answer: () => {
      const courses = localCourseRepository.list();
      return `Available courses include: ${courses.map((course) => `${course.id}: ${course.name}`).join(", ")}.`;
    },
  },
  {
    keywords: ["eat", "food", "restaurant", "hungry", "lunch", "dinner", "breakfast", "places to eat", "where to eat"],
    answer: () =>
      "Good places to eat near CCNY: Ten Dragon, Amsterdam Sushi, Halal Brothers, Tajeen Halal, Burger & Shake, Suhal's Deli, and Clove. Ask me about any of them for more details.",
  },
  {
    keywords: ["id card", "student id", "id replacement", "replace my id", "get my id", "one stop", "identification"],
    answer: () =>
      "You can get your student ID or a replacement ID at the One Stop Desk on campus.",
  },
  {
    keywords: ["study", "studying", "study spot", "where to study", "quiet place", "library"],
    answer: () =>
      "Good places to study at CCNY: NAC/Cohen Library, Sheppard Library, the NAC Rotunda, and Marshak Library.",
  },
  {
    keywords: ["hang out", "hangout", "chill", "relax", "free time", "social", "between class"],
    answer: () =>
      "Popular spots to hang out at CCNY: The Hoffman, NAC Cafeteria, Wingate Hall, and the Dormrooms.",
  },
  {
    keywords: ["tutor", "tutoring", "academic help", "help with class", "writing center", "academic support"],
    answer: () =>
      "CCNY tutoring resources: The Artino Center and the Marshak Tutoring Center. Both offer free academic support.",
  },
];

function tryLocalMatch(query: string, role: AIRole, email: string, name: string): string | null {
  const normalizedQuery = query.toLowerCase();
  const rule = localRules.find(
    (entry) =>
      entry.keywords.some((keyword) => normalizedQuery.includes(keyword)) &&
      (!entry.roles || entry.roles.includes(role)),
  );
  return rule ? rule.answer(role, email, name) : null;
}

async function queryGemini(query: string, context: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "The AI fallback is not configured. Add VITE_GEMINI_API_KEY to the local environment to enable Gemini responses.";
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are a helpful assistant for College0, a university student information system at CCNY (City College of New York).
Use the College0 context below as your primary source. Keep answers to 2 or 3 concise sentences.
For questions about nearby restaurants, campus buildings, or real-world places mentioned in the context, draw on your general knowledge to give helpful details like menus, addresses, or hours — and note that details may have changed.
For academic advice questions (e.g. how to improve GPA, consequences of low GPA), give practical advice based on the College0 policies in the context.

${context}

Question: ${query}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function handleAIQuery(
  query: string,
  role: AIRole,
  email: string,
  name: string,
): Promise<AIResponse> {
  const localAnswer = tryLocalMatch(query, role, email, name);
  if (localAnswer) {
    return { answer: localAnswer, source: "database", warning: false };
  }

  const context = buildRoleContext(role, email, name);
  const answer = await queryGemini(query, context);
  return { answer, source: "llm", warning: true };
}
