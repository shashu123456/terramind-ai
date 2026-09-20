import { useState } from "react";
import { Building2, Database, Factory, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const info = trpc.system.info.useQuery();
  const factors = trpc.factors.list.useQuery();
  const camps = trpc.campus.list.useQuery();
  const { signout } = useSignout();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [areaSqm, setAreaSqm] = useState("20000");
  const [occupancy, setOccupancy] = useState("1200");
  const [createError, setCreateError] = useState<string | null>(null);
  const create = trpc.campus.create.useMutation({
    onSuccess: () => {
      camps.refetch();
      setName("");
      setCity("");
      setAreaSqm("20000");
      setOccupancy("1200");
    },
    onError: (e) => setCreateError(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          System information, factor registry, campuses and session control.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-ibm-blue-700" /> System
            </CardTitle>
          </CardHeader>
          <CardContent>
            {info.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              info.data && (
                <dl className="space-y-2 text-sm">
                  <Row k="Version" v={`${info.data.version}`} />
                  <Row k="Mode" v={info.data.mode} />
                  <Row k="LLM provider" v={info.data.llm.model ? (info.data.llm.provider ?? "local") : "local"} />
                  <Row k="LLM model" v={info.data.llm.model ?? "campus-interventions-v1.0 (local engine)"} />
                  <Row k="Server time" v={new Date(info.data.now).toLocaleString()} />
                </dl>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LogOut className="h-4 w-4 text-ibm-blue-700" /> Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Signed in to the demo workspace. Logging out clears the local session cookie.</p>
            <Button variant="outline" onClick={() => signout()}>
              Sign out
            </Button>
            <p className="text-xs">
              In production, this builds a real authentication provider (e.g. SSO/OIDC). See the roadmap.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Factory className="h-4 w-4 text-ibm-blue-700" /> Factor registry
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Versioned, sourced default factors used by the deterministic engine. Over-ridable per workspace in
            production.
          </p>
        </CardHeader>
        <CardContent>
          {factors.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : factors.data && factors.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factor</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factors.data.map((f) => (
                  <TableRow key={f.key}>
                    <TableCell>
                      <div className="font-medium">{f.label}</div>
                      <div className="font-mono text-xs text-muted-foreground">{f.key}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {f.value} {f.unit}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {f.source}
                      {f.sourceUrl ? (
                        <a
                          href={f.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1 text-ibm-blue-700 underline underline-offset-2"
                        >
                          source
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{f.version}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No factors registered.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-ibm-blue-700" /> Create a campus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Campus name</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Northbridge University" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-city">City</Label>
              <Input id="c-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-area">Area (m²)</Label>
                <Input id="c-area" type="number" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-occ">Occupancy</Label>
                <Input id="c-occ" type="number" value={occupancy} onChange={(e) => setOccupancy(e.target.value)} />
              </div>
            </div>
            {createError && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</p>}
            <Button
              onClick={() =>
                create.mutate({
                  name,
                  city,
                  country: "India",
                  siteType: "campus",
                  areaSqm: Number(areaSqm) || 20000,
                  occupancy: Number(occupancy) || 1200,
                })
              }
              disabled={!name.trim() || create.isPending}
            >
              {create.isPending ? "Creating…" : "Create campus"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your campuses</CardTitle>
          </CardHeader>
          <CardContent>
            {camps.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : camps.data && camps.data.length > 0 ? (
              <div className="space-y-2">
                {camps.data.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.city}, {c.country} · {c.areaSqm.toLocaleString()} m² · {c.occupancy.toLocaleString()} people
                      </div>
                    </div>
                    <Badge className="border-0 bg-brand-100 text-brand-900">{c.siteType}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No campuses yet. Create one to start capturing a baseline.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function useSignout() {
  const utils = trpc.useUtils();
  const auth = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      auth.refetch();
    },
  });
  return { signout: () => logout.mutate(undefined) };
}