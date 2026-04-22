import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  badge?: string;
}

export function Card({ children, className = "", badge }: CardProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.18)] ${className}`}>
      {badge && (
        <div className="absolute right-4 top-4">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] text-slate-500">
            {badge}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border-b border-slate-100 px-6 py-5 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-6 ${className}`}>{children}</div>;
}
