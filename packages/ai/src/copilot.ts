import type {
  CampusBaseline,
  CatalogEntry,
  InterventionImpact,
  PortfolioResult,
} from "@terramind/core";
import { calculateInterventionImpact, listCatalog, sumInterventions } from "@terramind/core";
import { formatInr, formatTonnesCo2 } from "@terramind/shared";
import type { CopilotAnswer, CopilotCitation } from "@terramind/shared";
import { getEvidenceByIds } from "./rag/knowledge";

export interface CopilotContext {
  baseline?: CampusBaseline;
  campusName?: string;
  selectedSlugs?: string[];
  budgetInr?: number;
}

const GUARDRAIL_PATTERNS = [
  /\bguarantee\w*\b/i,
  /\bwill save (exactly|at least)/i,
  /\bcertified (savings|reduction)\w*/i,
  /\b100% (saving|cut|reduction)\b/i,
];

function guardrailRefusal(question: string): string | null {
  for (const p of GUARDRAIL_PATTERNS) {
    if (p.test(question)) {
      return (
        "I can't promise guaranteed or 'exactly X%' savings — that would be forecasting. " +
        "The calculators return an estimate range (low/mid/high) tied to data quality, and " +
        "verifying impact in the first year is how you turn an estimate into evidence."
      );
    }
  }
  return null;
}

function slugMatchedInQuestion(question: string): CatalogEntry[] {
  const q = question.toLowerCase();
  const aliases: Record<string, string[]> = {
    "energy-monitoring": ["monitor", "meter", "sub-meter"],
    "led-controls": ["led", "light"],
    "occupancy-sensors": ["occupan", "sensor"],
    "hvac-optimization": ["hvac", "cooling", "air conditioning", "ac schedule"],
    "low-flow-fixtures": ["low flow", "aerator", "fixture", "tap"],
    "rainwater-harvesting": ["rainwater", "rain water", "harvest"],
    "wastewater-reuse": ["wastewater", "greywater", "reuse water"],
    "waste-segregation": ["segregat", "sort waste", "wet dry"],
    composting: ["compost"],
    "native-landscape": ["landscape", "native", "garden"],
    "ev-charging-readiness": ["ev", "charging", "electric vehicle"],
    "rooftop-solar": ["solar", "pv", "panel", "rooftop"],
  };
  return listCatalog().filter((entry) =>
    (aliases[entry.slug] ?? [entry.slug]).some((alias) => q.includes(alias)),
  );
}

function citationFor(entry: CatalogEntry, _index: number): CopilotCitation[] {
  return getEvidenceByIds(entry.evidence).map((ev) => ({
    id: ev.id,
    title: ev.title,
    publisher: ev.publisher,
    url: ev.url,
    publishedAt: ev.publishedAt,
  }));
}

function describeImpact(impact: InterventionImpact): string {
  const parts: string[] = [];
  if (impact.energySavingsKwh.mid > 0)
    parts.push(
      `${Math.round(impact.energySavingsKwh.mid)} kWh/yr energy (range ${Math.round(
        impact.energySavingsKwh.low,
      )}–${Math.round(impact.energySavingsKwh.high)})`,
    );
  if (impact.waterSavingsKl.mid > 0)
    parts.push(
      `${Math.round(impact.waterSavingsKl.mid)} kL/yr water (range ${Math.round(
        impact.waterSavingsKl.low,
      )}–${Math.round(impact.waterSavingsKl.high)})`,
    );
  if (impact.wasteReductionKg.mid > 0)
    parts.push(
      `${Math.round(impact.wasteReductionKg.mid)} kg/yr waste (range ${Math.round(
        impact.wasteReductionKg.low,
      )}–${Math.round(impact.wasteReductionKg.high)})`,
    );
  parts.push(
    `carbon ${formatTonnesCo2(impact.carbonReductionTco2e.mid)} (range ${formatTonnesCo2(
      impact.carbonReductionTco2e.low,
    )}–${formatTonnesCo2(impact.carbonReductionTco2e.high)})`,
  );
  return parts.join("; ");
}

function buildGroundedAnswer(
  question: string,
  matched: CatalogEntry[],
  ctx: CopilotContext,
): { answer: string; citations: CopilotCitation[] } {
  const citations: CopilotCitation[] = [];

  if (!ctx.baseline) {
    const lines = matched.map((entry) => {
      const per = entry.capexInr;
      const phase = entry.phase;
      const evidence = getEvidenceByIds(entry.evidence);
      citations.push(...evidence.map((ev) => ({ id: ev.id, title: ev.title, publisher: ev.publisher, url: ev.url, publishedAt: ev.publishedAt })));
      return `• **${entry.title}** (~${formatInr(per)} capex, ${phase} phase) — ${entry.description}`;
    });
    return {
      answer:
        `You asked about **${matched.map((e) => e.title).join(", ")}**. ` +
        `Here's what's in the catalog: ${lines.join(" ")} ` +
        `Note the guidance notes assumptions for each action. Give me your campus baseline ` +
        `(annual kWh, kL water, kg waste) and a budget so I can compute scenario estimates — ` +
        `the numbers will come from the calculators, not me.`,
      citations,
    };
  }

  const baseline = ctx.baseline;
  const portfolio: PortfolioResult | null = sumInterventions(matched, baseline);
  const impacts = matched.map((entry) => calculateInterventionImpact(entry, baseline));

  const perAction = matched
    .map((entry, i) => {
      const impact = impacts[i];
      const payback = impact.paybackYears.mid;
      const pb =
        payback >= 999 ? "payback beyond the planning horizon" : `simple payback ~${payback.toFixed(1)} yr`;
      const ev = citationFor(entry, i);
      citations.push(...ev);
      return `• **${entry.title}** — ${describeImpact(impact)}; ${pb}.`;
    })
    .join(" ");

  const budget = ctx.budgetInr
    ? portfolio && portfolio.capexInr <= ctx.budgetInr
      ? `The total ${formatInr(portfolio.capexInr)} fits within your ${formatInr(ctx.budgetInr)} budget. `
      : `The total ${portfolio ? formatInr(portfolio.capexInr) : "capex"} exceeds the stated ${formatInr(ctx.budgetInr)} budget; combine selectively. `
    : "";

  return {
    citations,
    answer: [
      `Here's a **scenario estimate**${ctx.campusName ? ` for ${ctx.campusName}` : ""} (model: campus-interventions-v1.0, factors: india-demo-factors-v1.0). It is an estimate with uncertainty ranges, not a forecast.`,
      perAction,
      budget,
      `Combined, the bundle reduces carbon by roughly ${portfolio ? formatTonnesCo2(portfolio.carbonReductionTco2e.mid) : "—"} per year across these actions, before any site-specific feasibility check.`,
      `Trade-offs: ${portfolio ? portfolio.tradeoffs.join("; ") : "see individual assumptions."}`,
      `Verification tip: track the relevant meter for one year after installation — that's how an estimate becomes measured evidence.`,
    ].join(" "),
  };
}

export function copilotAsk(
  question: string,
  ctx: CopilotContext,
): CopilotAnswer {
  const refusal = guardrailRefusal(question);
  if (refusal) {
    return {
      answer: refusal,
      citations: [],
      provider: "local",
      model: "campus-interventions-copilot-local",
      grounded: true,
      limitation: "No numeric estimate was produced because the question implied a guarantee.",
    };
  }

  const matched = slugMatchedInQuestion(question);
  if (matched.length === 0) {
    const topics = listCatalog()
      .slice(0, 6)
      .map((e) => e.title)
      .join(", ");
    return {
      answer: `I can help you reason about specific campus sustainability actions. I currently know about: ${topics}, and more. Ask e.g. "Compare LED lighting and solar on this campus" or "What's the fastest-payback bundle under ₹10 Cr?"`,
      citations: [],
      provider: "local",
      model: "campus-interventions-copilot-local",
      grounded: true,
      limitation: "None of the catalog actions matched your question, so no numbers were computed.",
    };
  }

  const { answer, citations } = buildGroundedAnswer(question, matched, ctx);
  return {
    answer,
    citations,
    provider: "local",
    model: "campus-interventions-copilot-local",
    grounded: true,
    limitation: "Answer is a scenario estimate with ranges; ground-truth via meters after implementation.",
  };
}

export { getModes, listCatalog } from "@terramind/core";