import { useEffect, useState } from "react";
import {
  localPhaseStateRepository,
  type RegistrarFineRecord,
  type StudentSuspensionRecord,
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

export function useStudentSuspension(email: string): StudentSuspensionRecord | null {
  const [suspension, setSuspension] = useState<StudentSuspensionRecord | null>(() =>
    localPhaseStateRepository.getStudentSuspension(email),
  );

  useEffect(() => {
    const refresh = () => setSuspension(localPhaseStateRepository.getStudentSuspension(email));
    refresh();
    return localPhaseStateRepository.subscribe(refresh);
  }, [email]);

  return suspension;
}

export function useRegistrarFines(): RegistrarFineRecord[] {
  const [fines, setFines] = useState<RegistrarFineRecord[]>(() => localPhaseStateRepository.getRegistrarFines());

  useEffect(() => {
    const refresh = () => setFines(localPhaseStateRepository.getRegistrarFines());
    refresh();
    return localPhaseStateRepository.subscribe(refresh);
  }, []);

  return fines;
}

export function useStudentFines(email: string): RegistrarFineRecord[] {
  const [fines, setFines] = useState<RegistrarFineRecord[]>(() =>
    localPhaseStateRepository.getStudentFines(email),
  );

  useEffect(() => {
    const refresh = () => setFines(localPhaseStateRepository.getStudentFines(email));
    refresh();
    return localPhaseStateRepository.subscribe(refresh);
  }, [email]);

  return fines;
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
