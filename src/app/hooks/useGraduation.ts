import { useEffect, useState } from "react";
import {
  localGraduationRepository,
  type GraduationApplication,
} from "../services/localGraduationRepository";
import { localPhaseStateRepository } from "../services/localPhaseStateRepository";

export type GraduationDerivedStatus =
  | "graduated"
  | "pending"
  | "approved"
  | "rejected"
  | "none";

export interface GraduationStatusView {
  status: GraduationDerivedStatus;
  passingCompletions: number;
  latestApplication: GraduationApplication | null;
}

function buildView(email: string): GraduationStatusView {
  if (!email) {
    return { status: "none", passingCompletions: 0, latestApplication: null };
  }
  const graduated = localPhaseStateRepository.isStudentGraduated(email);
  const passingCompletions = localGraduationRepository.countPassingCompletions(email);
  const applications = [...localGraduationRepository.listForStudent(email)].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
  const latest = applications[0] ?? null;

  if (graduated) {
    return { status: "graduated", passingCompletions, latestApplication: latest };
  }
  if (!latest) {
    return { status: "none", passingCompletions, latestApplication: null };
  }
  return { status: latest.status, passingCompletions, latestApplication: latest };
}

export function useGraduationStatus(email: string): GraduationStatusView {
  const [view, setView] = useState<GraduationStatusView>(() => buildView(email));

  useEffect(() => {
    const refresh = () => setView(buildView(email));
    refresh();
    const unsubGrad = localGraduationRepository.subscribe(refresh);
    const unsubPhase = localPhaseStateRepository.subscribe(refresh);
    return () => {
      unsubGrad();
      unsubPhase();
    };
  }, [email]);

  return view;
}

export function usePendingGraduationApplications(): GraduationApplication[] {
  const [items, setItems] = useState<GraduationApplication[]>(() =>
    localGraduationRepository.listApplications().filter((entry) => entry.status === "pending"),
  );

  useEffect(() => {
    const refresh = () =>
      setItems(localGraduationRepository.listApplications().filter((entry) => entry.status === "pending"));
    refresh();
    return localGraduationRepository.subscribe(refresh);
  }, []);

  return items;
}

export function useAllGraduationApplications(): GraduationApplication[] {
  const [items, setItems] = useState<GraduationApplication[]>(() =>
    localGraduationRepository.listApplications(),
  );

  useEffect(() => {
    const refresh = () => setItems(localGraduationRepository.listApplications());
    refresh();
    return localGraduationRepository.subscribe(refresh);
  }, []);

  return items;
}
