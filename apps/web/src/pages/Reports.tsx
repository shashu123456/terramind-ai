import { useEffect, useState } from "react";
import { CircleGauge, FileText, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

type Kind = "scenario" | "trace" | "campus";

export default function Reports() {
  const list = trpc.report.list.useQuery();
  const campuses = trpc.campus.list.useQuery();
  const campusId = campuses.data?.[0]?.id;
  const scenarios = trpc.scenario.list.useQuery(
    { campusId: campusId ?? 1 },
    { enabled: campusId != null },
  );
  const traces = trpc.trace.list.useQuery({});
  const generate = trpc.report.generate.useMutation();
  const [kind, setKind] = useState<Kind>("scenario");
  const [targetId, setTargetId] = useState<string>("");
  const [generatedId, setGeneratedId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getReport = trpc.report.get.useQuery(
    { id: openId ?? 0 },
    { enabled: openId !== null && preview === null },
  );

  useEffect(() => {
    if (!targetId) return;
    const source =
      kind === "scenario" ? scenarios.data : kind === "trace" ? traces.data : campuses.data;
    if (source?.length) setTargetId(String(source[0].id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const handleGenerate = () => {
    if (!targetId) return;
    setError(null);
    const id = Number(targetId);
    generate.mutate(
      kind === "scenario"
        ? { kind: "scenario", scenarioId: id }
        : kind === "trace"
          ? { kind: "trace", traceId: id }
          : { kind: "campus", campusId: id },
      {
        onSuccess: (result) => {
          list.refetch();
          setGeneratedId(result.report.id);
          setOpenId(result.report.id);
          setPreview(result.packet.markdown);
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  const openReport = (id: number) => {
    setOpenId(id);
    setPreview(null);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Decision packets</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Generate a markdown decision packet from a scenario run, a decision trace or a baseline readiness review.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-ibm-blue-700" /> Generate a packet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Packet type</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => {
                    setKind(v as Kind);
                    setTargetId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scenario">Scenario run</SelectItem>
                    <SelectItem value="trace">Decision trace</SelectItem>
                    <SelectItem value="campus">Baseline readiness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={targetId || undefined} onValueChange={setTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {kind === "scenario" &&
                      scenarios.data?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          #{s.id} · {s.name}
                        </SelectItem>
                      ))}
                    {kind === "trace" &&
                      traces.data?.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          #{t.id} · {t.kind}
                        </SelectItem>
                      ))}
                    {kind === "campus" &&
                      campuses.data?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <Button onClick={handleGenerate} disabled={!targetId || generate.isPending}>
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate decision packet
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleGauge className="h-4 w-4 text-ibm-blue-700" /> Saved packets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {list.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !list.data || list.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No packets generated yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Generated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data.map((r) => (
                    <TableRow
                      key={r.id}
                      className={`cursor-pointer ${openId === r.id ? "bg-brand-50" : ""}`}
                      onClick={() => openReport(r.id)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                      <TableCell className="text-sm">{r.title}</TableCell>
                      <TableCell>
                        <Badge className="border-0 bg-muted text-muted-foreground">{r.entity.kind}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.generatedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Packet preview</CardTitle>
            <p className="text-xs text-muted-foreground">
              {generatedId
                ? `Last generated: #${generatedId}. Select a row to view its markdown.`
                : "Select a row or generate a packet."}
            </p>
          </CardHeader>
          <CardContent className="h-full">
            {openId && getReport.data ? (
              <pre className="h-[calc(100vh-14rem)] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-5">
                {preview ?? getReport.data.markdown}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No packet open.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}