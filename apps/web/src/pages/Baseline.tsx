import { useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import type { DataQuality } from "@terramind/shared";
import {
  formatNumber,
  formatTonnesCo2,
} from "@terramind/shared";
import { DataQualityBadge, EmptyState, PageHeader } from "@terramind/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const QUALITIES: DataQuality[] = [
  "measured",
  "entered",
  "derived",
  "modeled",
  "not-available",
];

function QualitySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: DataQuality) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DataQuality)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {QUALITIES.map((q) => (
          <SelectItem key={q} value={q}>
            {q}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface FormState {
  energyKwh: string;
  energyQuality: DataQuality;
  waterKl: string;
  waterQuality: DataQuality;
  wasteKg: string;
  wasteQuality: DataQuality;
  carbonTco2e: string;
  carbonQuality: DataQuality;
}

const EMPTY: FormState = {
  energyKwh: "",
  energyQuality: "entered",
  waterKl: "",
  waterQuality: "entered",
  wasteKg: "",
  wasteQuality: "entered",
  carbonTco2e: "",
  carbonQuality: "derived",
};

export default function Baseline() {
  const campuses = trpc.campus.list.useQuery();
  const [campusId, setCampusId] = useState<number | null>(null);
  const profile = trpc.campus.get.useQuery(
    { id: campusId ?? 0 },
    { enabled: Boolean(campusId) },
  );
  const importBaseline = trpc.campus.importBaseline.useMutation();
  const utils = trpc.useUtils();

  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (campusId == null && campuses.data?.length) {
      setCampusId(campuses.data[0].id);
    }
  }, [campuses.data, campusId]);

  const campusesSafe = campuses.data ?? [];

  const coverage = profile.data?.coverage ?? [];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!campusId) return;
    void importBaseline
      .mutateAsync({
        campusId,
        baseline: {
          energyKwh: form.energyKwh ? Number(form.energyKwh) : undefined,
          energyQuality: form.energyQuality,
          waterKl: form.waterKl ? Number(form.waterKl) : undefined,
          waterQuality: form.waterQuality,
          wasteKg: form.wasteKg ? Number(form.wasteKg) : undefined,
          wasteQuality: form.wasteQuality,
          carbonTco2e: form.carbonTco2e ? Number(form.carbonTco2e) : undefined,
          carbonQuality: form.carbonQuality,
        },
      })
      .then(() => {
        void utils.campus.get.invalidate({ id: campusId });
        void setForm(EMPTY);
      });
  };

  if (campuses.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!campusesSafe.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Baseline" description="Baseline data and data-quality labels for your campuses." />
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No campus yet"
          description="Create a campus in Settings, then return here to record its baseline."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Baseline"
        description="Enter annual metered or estimated quantities. Every number carries a data-quality label that flows into every scenario and report."
      />

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-lg">Campus</CardTitle>
          <CardDescription>Choose which campus these values belong to.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={campusId?.toString() ?? undefined}
            onValueChange={(v) => setCampusId(Number(v))}
          >
            <SelectTrigger className="w-full sm:max-w-sm">
              <SelectValue placeholder="Select a campus" />
            </SelectTrigger>
            <SelectContent>
              {campusesSafe.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {profile.data && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="font-display text-lg">Current baseline</CardTitle>
            <CardDescription>
              Data completeness {Math.round(profile.data.dataCompleteness)}%.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Annual value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverage.map((m) => (
                  <TableRow key={m.metric}>
                    <TableCell className="font-medium capitalize">{m.metric}</TableCell>
                    <TableCell>
                      {m.unit === "tco2e" ? formatTonnesCo2(m.value) : formatNumber(m.value)}
                      <span className="ml-1 text-xs text-ink-soft">{m.unit}</span>
                    </TableCell>
                    <TableCell className="text-sm text-ink-soft">{m.source ?? "—"}</TableCell>
                    <TableCell>
                      <DataQualityBadge quality={m.quality} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-lg">Update baseline</CardTitle>
          <CardDescription>
            Provide what you know. Leave a field blank to keep its current value.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="energyKwh">Annual electricity (kWh)</Label>
            <Input
              id="energyKwh"
              type="number"
              min={0}
              placeholder="e.g. 100000"
              value={form.energyKwh}
              onChange={(e) => set("energyKwh", e.target.value)}
            />
            <QualitySelect
              value={form.energyQuality}
              onChange={(v) => set("energyQuality", v)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waterKl">Annual water (kL)</Label>
            <Input
              id="waterKl"
              type="number"
              min={0}
              placeholder="e.g. 10000"
              value={form.waterKl}
              onChange={(e) => set("waterKl", e.target.value)}
            />
            <QualitySelect
              value={form.waterQuality}
              onChange={(v) => set("waterQuality", v)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wasteKg">Annual waste (kg)</Label>
            <Input
              id="wasteKg"
              type="number"
              min={0}
              placeholder="e.g. 20000"
              value={form.wasteKg}
              onChange={(e) => set("wasteKg", e.target.value)}
            />
            <QualitySelect
              value={form.wasteQuality}
              onChange={(v) => set("wasteQuality", v)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbonTco2e">Scope 2 emissions (tCO₂e)</Label>
            <Input
              id="carbonTco2e"
              type="number"
              min={0}
              placeholder="e.g. 70"
              value={form.carbonTco2e}
              onChange={(e) => set("carbonTco2e", e.target.value)}
            />
            <QualitySelect
              value={form.carbonQuality}
              onChange={(v) => set("carbonQuality", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              className="gap-2"
              onClick={handleSubmit}
              disabled={
                importBaseline.isPending ||
                (!form.energyKwh &&
                  !form.waterKl &&
                  !form.wasteKg &&
                  !form.carbonTco2e)
              }
            >
              <Save className="h-4 w-4" /> Save baseline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}