import { Lightbulb } from "lucide-react";
import {
  formatInr,
  formatPercent,
} from "@terramind/shared";
import type { InterventionSummary } from "@terramind/shared";
import { EmptyState, PageHeader } from "@terramind/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

const PHASE_TONES: Record<string, string> = {
  measure: "bg-brand-100 text-brand-900",
  reduce: "bg-blue-50 text-ibm-blue-700",
  generate: "bg-emerald-50 text-emerald-700",
  mobility: "bg-amber-50 text-amber-700",
};

function rateLine(i: InterventionSummary): string {
  const parts: string[] = [];
  if (i.energyRate) parts.push(`${formatPercent(i.energyRate)} electricity`);
  if (i.waterRate) parts.push(`${formatPercent(i.waterRate)} water`);
  if (i.wasteRate) parts.push(`${formatPercent(i.wasteRate)} waste`);
  return parts.join(" · ") || "Enabler — creates options for later phases";
}

export default function Interventions() {
  const q = trpc.interventions.list.useQuery();

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      </div>
    );
  }

  const interventions = q.data ?? [];

  if (!interventions.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Interventions" description="The evidence-linked actions the copilot can reason about." />
        <EmptyState icon={<Lightbulb className="h-6 w-6" />} title="No interventions" description="The intervention catalog is empty." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interventions"
        description={`${interventions.length} evidence-linked actions across four phases: measure, reduce, generate, mobility.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {interventions.map((i) => (
          <Card key={i.slug} className="flex flex-col">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-base leading-snug">{i.title}</CardTitle>
                <Badge className={PHASE_TONES[i.phase] ?? undefined}>{i.phase}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">{i.category}</Badge>
                {i.confidence && <Badge variant="outline">{i.confidence} confidence</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 text-sm">
              <p className="text-sm leading-relaxed text-ink-soft">{i.description}</p>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Capital cost</dt>
                  <dd className="font-medium">{formatInr(i.capexInr)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Expected reduction</dt>
                  <dd className="font-medium">{rateLine(i)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Feasibility</dt>
                  <dd className="font-medium">{formatPercent(i.feasibility)}</dd>
                </div>
              </dl>
              {i.prerequisites.length > 0 && (
                <p className="text-xs text-ink-soft">
                  Requires: {i.prerequisites.map((p) => p.replace(/-/g, " ")).join(", ")}
                </p>
              )}
              {i.sdgs.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1 pt-2">
                  {i.sdgs.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-soft"
                    >
                      SDG {s}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}