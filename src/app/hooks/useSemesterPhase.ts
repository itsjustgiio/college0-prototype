import { useEffect, useState } from "react";
import { localSemesterRepository, type SemesterPhase } from "../services/localSemesterRepository";

export function useSemesterPhase() {
  const [phase, setPhaseState] = useState<SemesterPhase>(() => localSemesterRepository.getPhase());

  useEffect(() => localSemesterRepository.subscribe(setPhaseState), []);

  return [phase, localSemesterRepository.setPhase] as const;
}
