import type { SVGProps } from "react";
import { cn } from "./cn";

/** TerraMind signature mark — an abstract "site + leaf + trace" glyph. */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
      aria-hidden
      {...props}
    >
      <rect width="32" height="32" rx="8" className="fill-[#172b3a]" />
      <path
        d="M9 22V10.5c0-.8.65-1.5 1.5-1.5h7.2c.8 0 1.5.65 1.5 1.5V22"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 22h11.2" stroke="#0f62fe" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16.5" cy="14.5" r="2.4" fill="#0f62fe" />
      <path
        d="M19.2 9.6c2.4 0 3.8 1.2 3.8 3.4 0 1.9-.9 3.2-2.4 3.8"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="0.01 2.6"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }): React.JSX.Element {
  return (
    <span className={cn("font-display text-lg font-semibold tracking-tight text-ink", className)}>
      TerraMind
      <span className="text-ibm-blue">AI</span>
    </span>
  );
}

export function Brand({ className }: { className?: string }): React.JSX.Element {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo />
      <Wordmark />
    </span>
  );
}