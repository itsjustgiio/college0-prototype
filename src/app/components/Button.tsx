import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50";

  const variantStyles = {
    primary: "bg-slate-950 text-white hover:bg-slate-800",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    outline: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizeStyles = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-4.5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </button>
  );
}
