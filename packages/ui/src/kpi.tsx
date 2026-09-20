import type { ReactNode } from "react";
import { cn } from "./cn";

export interface KpiCardProps {
  label: string;
  value: string | ReactNode;
  hint?: string;
  accent?: "blue" | "teal" | "sand" | "default";
  className?: string;
}

const ACCENTS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  blue: "text-ibm-blue",
  teal: "text-brand-700",
  sand: "text-amber-700",
  default: "text-ink",
};

export function KpiCard({ label, value, hint, accent = "default", className }: KpiCardProps): React.JSX.Element {
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-semibold", ACCENTS[accent])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}