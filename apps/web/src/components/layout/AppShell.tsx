import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CircleGauge,
  ClipboardList,
  FileText,
  Lightbulb,
  MessageSquareText,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { Brand } from "@terramind/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "./NavLink";

const NAV = [
  { href: "/", label: "Overview", icon: CircleGauge, exact: true },
  { href: "/baseline", label: "Baseline", icon: Building2, exact: false },
  { href: "/interventions", label: "Interventions", icon: Lightbulb, exact: false },
  { href: "/scenarios", label: "Scenarios", icon: SlidersHorizontal, exact: false },
  { href: "/copilot", label: "Copilot", icon: MessageSquareText, exact: false },
  { href: "/traces", label: "Decision traces", icon: ClipboardList, exact: false },
  { href: "/reports", label: "Reports", icon: FileText, exact: false },
  { href: "/settings", label: "Settings", icon: Settings, exact: false },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  if (!toggleTheme) return null;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent"
    >
      <BarChart3 className="h-3.5 w-3.5" />
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

function UserChip() {
  const { user, signout } = useAuth();
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <div className="text-xs font-semibold leading-tight text-ink">{user?.name}</div>
        <div className="text-[11px] leading-tight text-ink-soft">{user?.email ?? user?.role}</div>
      </div>
      <button
        type="button"
        onClick={() => void signout()}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent"
      >
        Sign out
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="border-t border-border p-3 text-[11px] leading-relaxed text-ink-soft">
          Explainable intervention planning for sustainable campuses.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-border bg-canvas/90 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Brand />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserChip />
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}