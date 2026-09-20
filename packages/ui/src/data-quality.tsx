import { cn } from "./cn";

export type DataQualityTone = "measured" | "entered" | "derived" | "modeled" | "not-available";

const TONES: Record<DataQualityTone, { label: string; className: string; dot: string }> = {
  measured: { label: "Measured", className: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  entered: { label: "Entered", className: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  derived: { label: "Derived", className: "bg-violet-50 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  modeled: { label: "Modeled", className: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  "not-available": {
    label: "Not available",
    className: "bg-slate-50 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

export function DataQualityBadge({
  quality,
  className,
}: {
  quality: DataQualityTone;
  className?: string;
}): React.JSX.Element {
  const tone = TONES[quality] ?? TONES["not-available"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {tone.label}
    </span>
  );
}

export function qualityTone(q: string): DataQualityTone {
  return (["measured", "entered", "derived", "modeled", "not-available"].includes(q) ? q : "not-available") as DataQualityTone;
}