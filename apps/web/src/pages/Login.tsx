import { useState } from "react";
import { Brand } from "@terramind/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const { login, loggingIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const info = trpc.system.info.useQuery();

  const handleLogin = async () => {
    setError(null);
    try {
      await login({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start a demo session.");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Brand />
          </div>
          <CardTitle className="font-display text-2xl">Campus sustainability cockpit</CardTitle>
          <CardDescription>
            An explainable copilot for planning sustainability interventions on
            institutional sites. Scenario estimates, measured data, transparent
            trade-offs, and a decision trace you can audit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={() => void handleLogin()}
            disabled={loggingIn}
          >
            {loggingIn ? "Starting session…" : "Enter demo workspace"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
            {info.data
              ? `TerraMind AI ${info.data.version} · mode ${info.data.demo ? "demo" : "production"} · LLM provider: ${info.data.llm.provider}.`
              : "TerraMind AI — explainable, scenario-based sustainability planning."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}