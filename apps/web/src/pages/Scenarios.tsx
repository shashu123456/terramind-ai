import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Check,
  FlaskConical,
  Play,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  formatInr,
  formatInrCompact,
  formatNumber,
  formatTonnesCo2,
} from "@terramind/shared";
import type { DecisionMode, ImpactRange, ScenarioDetail } from "@terramind/shared";
import { PageHeader } from "@terramind/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

function fmtRange(r: ImpactRange | undefined, unit: "kwh" | "kl" | "kg" | "tco2e") {
  if (!r) return "—";
  const f =
    unit === "tco2e"
      ? (v: number) => formatTonnesCo2(v)
      : (v: number) => `${formatNumber(v)} ${unit}`;
  return `${f(r.mid)} (${f(r.low)}–${f(r.high)})`;
}

export default function Scenarios() {
  const camps = trpc.campus.list.useQuery();
  const modes = trpc.scenario.modes.useQuery();
  const interventions = trpc.interventions.list.useQuery();
  const utils = trpc.useUtils();

  const [campusId, setCampusId] = useState<number | number>();
  const [selected, setSelected] = useState<string[]>([]);
  const [budgetInr, setBudgetInr] = useState("5000000");
  const [horizonYears, setHorizonYears] = useState("5");
  const [mode, setMode] = useState<DecisionMode>("balanced");

  const profile = trpc.campus.get.useQuery(
    { id: Number(campusId) },
    { enabled: Boolean(campusId) },
  );
  const list = trpc.scenario.list.useQuery(
    { campusId: Number(campusId) },
    { enabled: Boolean(campusId) },
  );

  const run = trpc.scenario.run.useMutation();
  const save = trpc.scenario.save.useMutation();
  const approve = trpc.scenario.approve.useMutation();
  const [lastRun, setLastRun] = useState<ScenarioDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseline = profile.data?.baseline;

  useEffect(() => {
    if (!campusId && camps.data?.length) setCampusId(camps.data[0].id);
    if (campusId && baseline && selected.length === 0) {
      // Default to the three most cost-effective quick wins.
      const slugs = interventions.data
        ?.filter((i) => !i.enabler)
        .sort((a, b) => a.capexInr - b.capexInr)
        .slice(0, 3)
        .map((i) => i.slug);
      if (slugs) setSelected(slugs);
    }
  }, [campusId, baseline, camps.data, interventions.data, selected.length]);

  const paretoData = useMemo(
    () => ({
      points: (lastRun?.portfolios ?? []).map((x) => ({
        capex: x.capexInr,
        carbon: x.carbonReductionTco2e.mid,
        name: x.title,
      })),
    }),
    [lastRun],
  );

  const toggle = (slug: string) =>
    setSelected((s) =>
      s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug],
    );

  const doRun = (withName?: string) => {
    if (!campusId || !baseline) return;
    setError(null);
    const input = {
      campusId,
      baseline,
      interventionSlugs: selected,
      budgetInr: Number(budgetInr),
      horizonYears: Number(horizonYears),
      mode,
    };
    const promise = withName
      ? save.mutateAsync({ ...input, name: withName })
      : run.mutateAsync(input);
    promise
      .then((r) => {
        setLastRun(r.detail);
        void utils.scenario.list.invalidate({ campusId });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Scenario run failed."));
  };

  const doApprove = (id: number, status: "approved" | "rejected") => {
    void approve
      .mutateAsync({ id, status })
      .then(() => {
        void utils.scenario.list.invalidate({ campusId });
        if (lastRun && lastRun.id === id) {
          setLastRun((x) => (x ? { ...x, status } : x));
        }
      });
  };

  if (camps.isLoading || modes.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const modeDef = modes.data?.find((m) => m.id === mode);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenario studio"
        description="Pick actions, set a budget and an objective, and the engine ranks portfolios with visible weights and trade-offs."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="font-display text-lg">Configure a run</CardTitle>
            <CardDescription>
              Baseline is read from the campus profile. Weights and trade-offs
              are shown — nothing is hidden inside the ranking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Campus</Label>
                <Select
                  value={campusId?.toString()}
                  onValueChange={(v) => {
                    setCampusId(Number(v));
                    setLastRun(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {(camps.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objective mode</Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as DecisionMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(modes.data ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horizon">Horizon (years)</Label>
                <Input
                  id="horizon"
                  type="number"
                  min={1}
                  max={30}
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(e.target.value)}
                />
              </div>
            </div>

            {modeDef && (
              <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                <strong>{modeDef.label}</strong> — {modeDef.why} Weights: carbon{" "}
                {modeDef.weights.carbon}, cost {modeDef.weights.cost}, resilience{" "}
                {modeDef.weights.resilience}.
              </p>
            )}

            <div>
              <Label className="mb-2 block">Interventions</Label>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {(interventions.data ?? []).map((i) => (
                  <label
                    key={i.slug}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selected.includes(i.slug)}
                      onCheckedChange={() => toggle(i.slug)}
                    />
                    <span className="leading-snug">
                      <span className="font-medium text-ink">{i.title}</span>
                      <span className="block text-xs text-ink-soft">
                        {formatInrCompact(i.capexInr)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2"
                disabled={run.isPending || save.isPending || !baseline || !selected.length}
                onClick={() => doRun()}
              >
                <Play className="h-4 w-4" /> Run scenario
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={run.isPending || save.isPending || !baseline || !selected.length}
                onClick={() => doRun("Saved scenario")}
              >
                <Save className="h-4 w-4" /> Run & save
              </Button>
            </div>

            {!baseline && (
              <p className="text-xs text-ink-soft">
                Add an energy/water/waste baseline for this campus first (Baseline page).
              </p>
            )}
          </CardContent>
        </Card>

        {lastRun ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="font-display text-lg">
                  {lastRun.name} {lastRun.id > 0 && <Badge variant="secondary">#{lastRun.id}</Badge>}
                </CardTitle>
                <CardDescription>
                  Mode: {lastRun.mode} · budget {formatInr(lastRun.budgetInr)} · horizon{" "}
                  {lastRun.horizonYears} yr · model {lastRun.modelVersion} · factors{" "}
                  {lastRun.factorVersion}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  {lastRun.impacts.map((im) => (
                    <div key={im.slug} className="rounded-lg border border-border p-3 text-sm">
                      <div className="font-medium">{im.title}</div>
                      <dl className="mt-1 space-y-0.5 text-xs text-ink-soft">
                        <div className="flex justify-between">
                          <dt>Capex</dt>
                          <dd>{formatInr(im.capexInr)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Electricity</dt>
                          <dd>{fmtRange(im.energySavingsKwh, "kwh")}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Water</dt>
                          <dd>{fmtRange(im.waterSavingsKl, "kl")}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Carbon</dt>
                          <dd>{fmtRange(im.carbonReductionTco2e, "tco2e")}</dd>
                        </div>
                        {typeof im.paybackYears.mid === "number" && im.paybackYears.mid < 999 && (
                          <div className="flex justify-between">
                            <dt>Payback</dt>
                            <dd>{im.paybackYears.mid.toFixed(1)} yr</dd>
                          </div>
                        )}
</dl>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="font-display text-lg">Ranked portfolios</CardTitle>
                {lastRun.id > 0 && (
                  <Badge variant={lastRun.status === "approved" ? "default" : "secondary"}>
                    {lastRun.status}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bundle</TableHead>
                      <TableHead>Capex</TableHead>
                      <TableHead>Carbon</TableHead>
                      <TableHead>Payback</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastRun.portfolios.map((p) => (
                      <TableRow key={p.slugs.join("+")}>
                        <TableCell className="max-w-[220px]">
                          <div className="truncate font-medium">{p.title}</div>
                          <div className="truncate text-xs text-ink-soft">{p.slugs.length} actions</div>
                        </TableCell>
                        <TableCell>{formatInrCompact(p.capexInr)}</TableCell>
                        <TableCell>{formatTonnesCo2(p.carbonReductionTco2e.mid)}</TableCell>
                        <TableCell>
                          {p.paybackYears.mid >= 999 ? " >" : `${p.paybackYears.mid.toFixed(1)} yr`}
                        </TableCell>
                        <TableCell>{p.score.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {paretoData.points.length > 1 && (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="capex"
                          name="Capex (₹)"
                          tickFormatter={(v: number) => formatInrCompact(v)}
                          stroke="var(--muted-foreground)"
                        />
                        <YAxis
                          dataKey="carbon"
                          name="Carbon (tCO₂e)"
                          tickFormatter={(v: number) => formatNumber(v)}
                          stroke="var(--muted-foreground)"
                        />
                        <ReTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0].payload as { name: string; capex: number; carbon: number };
                            return (
                              <div className="rounded-md border border-border bg-background p-2 text-xs shadow">
                                <div className="font-medium">{p.name}</div>
                                <div>{formatInrCompact(p.capex)}</div>
                                <div>{formatTonnesCo2(p.carbon)}</div>
                              </div>
                            );
                          }}
                        />
                        <Legend />
                        <Scatter name="Portfolio" dataKey="carbon" fill="var(--ibm-blue)" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {lastRun.portfolios[0]?.tradeoffs.length > 0 && (
                  <ul className="space-y-1 text-xs text-ink-soft">
                    {lastRun.portfolios[0].tradeoffs.slice(0, 3).map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                )}

                {lastRun.id > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {lastRun.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => doApprove(lastRun.id, "approved")}
                          disabled={approve.isPending}
                        >
                          <ShieldCheck className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => doApprove(lastRun.id, "rejected")}
                          disabled={approve.isPending}
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    <Link href="/reports">
                      <Button size="sm" variant="link" className="gap-1">
                        Generate decision packet <Check className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center border-dashed">
            <CardContent className="py-20 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-ink-soft" />
              <p className="text-sm text-ink-soft">
                Run a scenario to see ranked portfolios, impact ranges, and the Pareto frontier.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-lg">Saved scenarios</CardTitle>
          <CardDescription>Approve or reject a run to record an auditable decision.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(list.data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm capitalize">{s.mode}</TableCell>
                  <TableCell>{formatInrCompact(s.budgetInr)}</TableCell>
                  <TableCell>{s.runCount}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "approved" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={approve.isPending}
                      onClick={() => doApprove(s.id, s.status === "approved" ? "rejected" : "approved")}
                    >
                      {s.status === "approved" ? "Reject" : "Approve"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!list.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-ink-soft">
                    No saved scenarios yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}