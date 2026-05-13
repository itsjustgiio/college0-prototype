import { useEffect, useState } from "react";
import { localComplaintsRepository, type ComplaintRecord } from "../services/localComplaintsRepository";

export function useComplaints(): ComplaintRecord[] {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => localComplaintsRepository.list());

  useEffect(() => {
    return localComplaintsRepository.subscribe(() => {
      setComplaints(localComplaintsRepository.list());
    });
  }, []);

  return complaints;
}
