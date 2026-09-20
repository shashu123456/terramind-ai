import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Bot, BookOpen, ExternalLink, Loader2, Send, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@terramind/ui";
import { trpc } from "@/lib/trpc";

interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  citations?: { id: string; title: string; publisher: string; url: string }[];
  limitation?: string | null;
  traceId?: number | null;
  error?: boolean;
}

const SUGGESTIONS = [
  "Which action should we test first if the budget is ₹20 lakh?",
  "Explain why demand reduction should come before rooftop solar.",
  "What data would increase confidence in our water estimate?",
];

export default function Copilot() {
  const campuses = trpc.campus.list.useQuery();
  const [campusId, setCampusId] = useState<string>("");
  useEffect(() => {
    if (!campusId && campuses.data?.length) setCampusId(String(campuses.data[0].id));
  }, [campuses.data, campusId]);

  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const ask = trpc.copilot.ask.useMutation({
    onSuccess: (result) => {
      setMessages((cur) => [
        ...cur,
        {
          role: "assistant",
          content: result.answer,
          citations: result.citations,
          limitation: result.limitation,
          traceId: result.traceId,
        },
      ]);
    },
    onError: (error) => {
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: `I could not complete that request: ${error.message}`, error: true },
      ]);
    },
  });

  const handleSend = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || ask.isPending) return;
    setMessages((cur) => [...cur, { role: "user", content: trimmed }]);
    ask.mutate({ campusId: campusId ? Number(campusId) : undefined, question: trimmed });
    setInput("");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Ask your sustainability copilot</CardTitle>
              <Select value={campusId} onValueChange={(v) => setCampusId(v)}>
                <SelectTrigger className="w-[230px]">
                  <SelectValue placeholder="Campus context" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  The copilot explains modeled decisions, cites approved sources, and tells you what data is still
                  missing. It never invents numbers — every figure comes from the deterministic engine and is labelled
                  as a scenario estimate, not a forecast.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto justify-start whitespace-normal text-left text-xs"
                      onClick={() => handleSend(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className="flex gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        m.role === "user" ? "bg-brand-100 text-brand-900" : "bg-ibm-blue-700 text-white"
                      }`}
                    >
                      {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div
                        className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                          m.error
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-border bg-muted/40 whitespace-pre-wrap"
                        }`}
                      >
                        {m.content}
                      </div>
                      {!m.error && m.citations && m.citations.length > 0 && (
                        <div className="rounded-lg border border-border bg-background p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" /> Retrieved evidence
                          </p>
                          <ul className="space-y-1.5">
                            {m.citations.map((c) => (
                              <li key={c.id}>
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-ibm-blue-700 underline decoration-ibm-blue-700/40 underline-offset-2 hover:decoration-ibm-blue-700"
                                >
                                  {c.title} <ExternalLink className="h-3 w-3" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!m.error && m.traceId && (
                        <p className="text-xs text-muted-foreground">
                          Decision trace:{" "}
                          <Link
                            to={`/traces`}
                            className="font-medium text-ibm-blue-700 underline underline-offset-2"
                          >
                            #{m.traceId}
                          </Link>
                          {m.limitation ? ` · ${m.limitation}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this campus…"
            disabled={ask.isPending}
          />
          <Button type="submit" disabled={ask.isPending || !input.trim()}>
            {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </Button>
        </form>
      </div>
      <div className="space-y-4">
        <Card className="border-ibm-blue-700/20 bg-ibm-blue-700/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-ibm-blue-700" /> How guardrails work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              The copilot runs on the <strong>local deterministic reasoning engine</strong> — no API keys, no external
              call. Every number in an answer is computed by the registered campus-interventions model and labelled as
              a <strong>scenario estimate</strong>.
            </p>
            <p>Answers include units, uncertainty ranges, model and factor versions, and citation links.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Guarantees about savings or payback are refused.</li>
              <li>Certified financial claims are refused.</li>
              <li>Missing coverage is surfaced as a data gap, never silently imputed.</li>
              <li>Questions that mention no matching action fall back to general reasoning with no invented numbers.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What it cannot do</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            It does not forecast the future, guarantee results, or compute impacts outside its calculator engine. Use
            the outputs to sequence investments and measurement, then approve the decision trace before acting.
          </CardContent>
        </Card>
      </div>
      {!campuses.isLoading && (!campuses.data || campuses.data.length === 0) && (
        <EmptyState
          title="No campus yet"
          description="Create a campus in Settings before asking the copilot."
          action={<Link to="/settings">Go to Settings</Link>}
          className="lg:col-span-2"
        />
      )}
    </div>
  );
}