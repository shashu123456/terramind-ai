import { Link } from "wouter";
import { ArrowRight, Building2, Sparkles } from "lucide-react";
import { DataQualityBadge, EmptyState, KpiCard, PageHeader } from "@terramind/ui";
import {
  formatNumber,
  formatTonnesCo2,
  formatIndian,
} from "@terramind/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function Overview() {
  const campuses = trpc.campus.list.useQuery();
  const info = trpc.system.info.useQuery();
  const health = trpc.system.health.useQuery();

  const campus = campuses.data?.[0];
  const profile = trpc.campus.get.useQuery(
    { id: campus?.id ?? 0 },
    { enabled: Boolean(campus) },
  );

  if (campuses.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!campus) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Start by setting up a campus baseline so the copilot can reason about real numbers."
        />
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No campus yet"
          description="Add a campus and its baseline (energy, water, waste, carbon) to unlock scenario planning and reports."
          action={
            <Link href="/baseline">
              <Button>Set up baseline</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const site = profile.data;
  const coverage = site?.coverage ?? [];
  const energy = coverage.find((c) => c.metric === "energy");
  const water = coverage.find((c) => c.metric === "water");
  const waste = coverage.find((c) => c.metric === "waste");
  const carbon = coverage.find((c) => c.metric === "carbon");

  return (
    <div className="space-y-6">
      <PageHeader
        title={campus.name}
        description={`${campus.city}, ${campus.country} · ${formatIndian(campus.areaSqm)} m² · ${formatIndian(campus.occupancy)} occupants · site type: ${campus.siteType}.`}
        actions={
          <Link href="/scenarios">
            <Button className="gap-2">
              Plan interventions <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Annual electricity"
          value={energy ? formatNumber(energy.value) : "—"}
          hint={energy?.unit === "kwh" ? "kWh" : ""}
          accent="blue"
        />
        <KpiCard
          label="Annual water use"
          value={water ? formatNumber(water.value) : "—"}
          hint={water?.unit === "kl" ? "kL" : ""}
          accent="teal"
        />
        <KpiCard
          label="Annual waste"
          value={waste ? formatNumber(waste.value) : "—"}
          hint={waste?.unit === "kg" ? "kg" : ""}
        />
        <KpiCard
          label="Scope 2 emissions (est.)"
          value={carbon ? formatTonnesCo2(carbon.value) : "—"}
          hint={carbon?.unit === "tco2e" ? "tCO₂e / yr" : ""}
          accent="sand"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-lg">Baseline data quality</CardTitle>
          {site && (
            <Badge variant="secondary">
              Completeness {Math.round(site.dataCompleteness)}%
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {site && (
            <Progress value={Math.round(site.dataCompleteness)} className="h-2" />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {[energy, water, waste, carbon]
              .filter(Boolean)
              .map((m) => (
                <div
                  key={m!.metric}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium capitalize text-ink">{m!.metric}</span>
                    <span className="ml-2 text-xs text-ink-soft">{m!.source ?? "no source recorded"}</span>
                  </div>
                  <DataQualityBadge quality={m!.quality} />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
        <span>
          Model: <code>{info.data?.version}</code> · Factors:{" "}
          <code>india-demo-factors-v1.0</code>
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-ibm-blue" />
          API {health.data?.status ?? "…"} · demo mode: {String(info.data?.demo ?? campus.workspaceId == null)}
        </span>
      </div>
    </div>
  );
}