import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const variantStyles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
