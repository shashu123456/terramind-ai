import { useState } from "react";
import { ClipboardList, Loader2, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@terramind/ui";
import { trpc } from "@/lib/trpc";

const KIND_TONES: Record<string, string> = {
  scenario: "bg-brand-100 text-brand-900",
  approval: "bg-amber-50 text-amber-700",
  copilot: "bg-ibm-blue-700/10 text-ibm-blue-700",
};

const STATUS_TONES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function Trace() {
  const list = trpc.trace.list.useQuery({});
  const approve = trpc.trace.approve.useMutation({
    onSuccess: () => list.refetch(),
  });
  const [error, setError] = useState<string | null>(null);

  const setStatus = (id: number, status: "approved" | "rejected") => {
    setError(null);
    approve.mutate(
      { id, status },
      { onError: (e) => setError(e.message) },
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Decision traces</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Every scenario run, copilot answer and approval records an immutable trace — inputs, model and factor
          versions, weights, citations and status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-ibm-blue-700" /> Trace log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          {list.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !list.data || list.data.length === 0 ? (
            <EmptyState
              title="No traces yet"
              description="Run a scenario or ask the copilot to record the first decision trace."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${KIND_TONES[t.kind] ?? "bg-muted text-muted-foreground"}`}>
                        {t.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm" title={t.summary}>
                      {t.summary}
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${STATUS_TONES[t.approvalStatus] ?? "bg-muted text-muted-foreground"}`}>
                        {t.approvalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.approvalStatus === "pending" && (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => setStatus(t.id, "approved")}
                            disabled={approve.isPending}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs"
                            onClick={() => setStatus(t.id, "rejected")}
                            disabled={approve.isPending}
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                      {approve.isPending && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}