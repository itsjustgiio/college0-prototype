import { useEffect, useState } from "react";
import { localGradingRepository, type GradeRecord } from "../services/localGradingRepository";
import { localPhaseStateRepository } from "../services/localPhaseStateRepository";

export function useCourseGrades(courseId: string, semester?: string): GradeRecord[] {
  const [records, setRecords] = useState<GradeRecord[]>(() =>
    courseId ? localGradingRepository.listForCourse(courseId, semester) : [],
  );

  useEffect(() => {
    const refresh = () => {
      setRecords(courseId ? localGradingRepository.listForCourse(courseId, semester) : []);
    };
    refresh();
    return localGradingRepository.subscribe(refresh);
  }, [courseId, semester]);

  return records;
}

export function useStudentGradesThisSemester(email: string): GradeRecord[] {
  const [records, setRecords] = useState<GradeRecord[]>(() =>
    email ? localGradingRepository.listForStudent(email) : [],
  );

  useEffect(() => {
    const refresh = () => {
      setRecords(email ? localGradingRepository.listForStudent(email) : []);
    };
    refresh();
    return localGradingRepository.subscribe(refresh);
  }, [email]);

  return records;
}

export function useStudentAcademicStatus(email: string): { terminated: boolean; honorRoll: boolean } {
  const [status, setStatus] = useState({
    terminated: localPhaseStateRepository.isStudentTerminated(email),
    honorRoll: localPhaseStateRepository.isHonorRoll(email),
  });

  useEffect(() => {
    const refresh = () =>
      setStatus({
        terminated: localPhaseStateRepository.isStudentTerminated(email),
        honorRoll: localPhaseStateRepository.isHonorRoll(email),
      });
    refresh();
    return localPhaseStateRepository.subscribe(refresh);
  }, [email]);

  return status;
}
