import { Link, useLocation, useRoute } from "wouter";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function NavLink({ href, label, icon: Icon, exact }: NavItemProps) {
  const [exactMatch] = useRoute(href);
  const [location] = useLocation();
  const isActive = exact ? exactMatch : exactMatch || (href !== "/" && location.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-900 text-white"
          : "text-ink-soft hover:bg-brand-50 hover:text-brand-900",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}