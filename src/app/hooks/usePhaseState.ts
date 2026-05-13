import { useEffect, useState } from "react";
import {
  localPhaseStateRepository,
  type TransitionSummary,
} from "../services/localPhaseStateRepository";

export function useSpecialReregEligible(email: string): boolean {
  const [eligible, setEligible] = useState(() => localPhaseStateRepository.isSpecialReregEligible(email));

  useEffect(() => {
    const refresh = () => setEligible(localPhaseStateRepository.isSpecialReregEligible(email));
    refresh();
    return localPhaseStateRepository.subscribe(refresh);
  }, [email]);

  return eligible;
}

export function useInstructorSuspension(email: string): boolean {
  const [suspended, setSuspended] = useState(() => localPhaseStateRepository.isInstructorSuspended(email));

  useEffect(() => {
    const refresh = () => setSuspended(localPhaseStateRepository.isInstructorSuspended(email));
    refresh();
    return localPhaseStateRepository.subscribe(refresh);
  }, [email]);

  return suspended;
}

export function useLastTransitionSummary(): TransitionSummary | null {
  const [summary, setSummary] = useState<TransitionSummary | null>(() =>
    localPhaseStateRepository.getLastTransitionSummary(),
  );

  useEffect(() => {
    const refresh = () => setSummary(localPhaseStateRepository.getLastTransitionSummary());
    refresh();
    return localPhaseStateRepository.subscribe(refresh);
  }, []);

  return summary;
}
