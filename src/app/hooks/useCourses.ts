import { useEffect, useState } from "react";
import { localCourseRepository, type CourseState } from "../services/localCourseRepository";

export function useCourses(): CourseState[] {
  const [courses, setCourses] = useState<CourseState[]>(() => localCourseRepository.list());

  useEffect(() => {
    const refresh = () => setCourses(localCourseRepository.list());
    refresh();
    return localCourseRepository.subscribe(refresh);
  }, []);

  return courses;
}
