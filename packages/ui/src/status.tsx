import { cn } from "./cn";

export type Status = "approved" | "pending" | "rejected";

const DOTS: Record<Status, string> = {
  approved: "bg-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-rose-500",
};

const LABELS: Record<Status, string> = {
  approved: "Approved",
  pending: "Pending approval",
  rejected: "Rejected",
};

export function StatusDot({ status, className }: { status: Status; className?: string }): React.JSX.Element {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted", className)}>
      <span className={cn("h-2 w-2 rounded-full", DOTS[status] ?? DOTS.pending)} />
      {LABELS[status] ?? status}
    </span>
  );
}

export function toStatus(s: string): Status {
  return (["approved", "pending", "rejected"].includes(s) ? s : "pending") as Status;
}