import { listFactors } from "@terramind/core";
import {
  FACTOR_VERSION,
  MODEL_VERSION,
  formatInr,
  formatNumber,
  formatTonnesCo2,
} from "@terramind/shared";
import type {
  CampusBaseline,
  CampusSummary,
  DecisionPacket,
  DecisionTrace,
  MetricCoverage,
  PortfolioResult,
} from "@terramind/shared";

export const REPORT_TEMPLATE_VERSION = "decision-packet-v1";

export interface DecisionPacketInput {
  title: string;
  generatedAt: string;
  entity: { kind: "scenario" | "trace" | "campus"; id: number };
  campus?: CampusSummary | null;
  coverage?: MetricCoverage[];
  baseline?: CampusBaseline;
  portfolios: PortfolioResult[];
  pareto?: PortfolioResult[];
  mode?: { label: string; description: string; weights: { carbon: number; cost: number; resilience: number }; why: string } | null;
  trace?: DecisionTrace | null;
  topAction?: { slug: string; title: string } | null;
}

function coverageTable(coverage?: MetricCoverage[]): string {
  if (!coverage || coverage.length === 0) return "_No baseline observations recorded yet._\n";
  const header = "| Metric | Annual value | Unit | Quality | Source |";
  const sep = "|---|---|---|---|---|";
  const rows = coverage.map(
    (c) => `| ${c.metric} | ${formatNumber(c.value, 1)} | ${c.unit} | ${c.quality} | ${c.source ?? "—"} |`,
  );
  return [header, sep, ...rows].join("\n") + "\n";
}

function portfolioTable(portfolios: PortfolioResult[]): string {
  const header = "| # | Bundle | Capex | Carbon (mid tCO₂e/yr) | Payback | Score |";
  const sep = "|---:|---:|---:|---:|---:|---:|";
  const rows = portfolios.map((p, i) => {
    const payback = p.paybackYears.mid >= 999 ? ">" : `~${formatNumber(p.paybackYears.mid, 1)} yr`;
    return `| ${i + 1} | ${p.title} | ${formatInr(p.capexInr)} | ${formatTonnesCo2(p.carbonReductionTco2e.mid)} | ${payback} | ${p.score.toFixed(3)} |`;
  });
  return [header, sep, ...rows].join("\n") + "\n";
}

function modeLines(mode?: DecisionPacketInput["mode"]): string {
  if (!mode) return "";
  return [
    `- **Mode:** ${mode.label}`,
    `- **Weights:** carbon ${Math.round(mode.weights.carbon * 100)}%, cost ${Math.round(mode.weights.cost * 100)}%, resilience ${Math.round(mode.weights.resilience * 100)}%`,
    `- **Why:** ${mode.why}`,
  ].join("\n") + "\n";
}

function traceLines(trace?: DecisionTrace | null): string {
  if (!trace) return "";
  return [
    `- Trace ID: **${trace.id}** (kind: ${trace.kind})`,
    `- Model version: ${trace.modelVersion}`,
    `- Factor version: ${trace.factorVersion}`,
    `- Status: ${trace.approvalStatus}`,
    `- Created: ${new Date(trace.createdAt).toLocaleString("en-IN")}`,
  ].join("\n") + "\n";
}

function factorsTable(): string {
  const header = "| Factor | Value | Unit | Scope | Source | Version |";
  const sep = "|---|---|---|---|---|---|";
  const rows = listFactors().map(
    (f) => `| ${f.label} | ${f.value} | ${f.unit} | ${f.scope} | ${f.source} | ${f.version} |`,
  );
  return [header, sep, ...rows].join("\n") + "\n";
}

/**
 * Renders a decision packet in Markdown. Every value shown here originates in
 * the deterministic engine output; the AI layer never writes into it.
 */
export function generateDecisionPacket(input: DecisionPacketInput): DecisionPacket {
  const md: string[] = [];
  md.push(`# ${input.title}`);
  md.push(`Generated ${new Date(input.generatedAt).toLocaleString("en-IN")} · template ${REPORT_TEMPLATE_VERSION}`);
  md.push("");

  md.push("> ⚠️ **What this is:** a scenario estimate to support a human decision. It is **not** a forecast or a guarantee of outcome. All savings are modeled ranges from registered factors and catalog assumptions, versioned below. Approve nothing without reading the assumptions and limitations sections.");
  md.push("");

  // Executive summary
  md.push("## Executive summary");
  const top = input.topAction;
  if (top) {
    md.push(`Recommended starting action: **${top.title}**.`);
  }
  if (input.baseline) {
    md.push(`Baseline (${input.campus?.name ?? "this site"}): ${formatNumber(input.baseline.annualEnergyKwh, 0)} kWh/yr electricity, ${formatNumber(input.baseline.annualWaterKl, 0)} kL/yr water, ${formatNumber(input.baseline.annualWasteKg, 0)} kg/yr waste${input.baseline.annualCarbonTco2e ? `, ~${formatTonnesCo2(input.baseline.annualCarbonTco2e)} carbon` : ""}.`);
  }
  if (input.portfolios.length > 0) {
    const best = input.portfolios[0];
    md.push(`Top portfolio **${best.title}**: ${formatInr(best.capexInr)} capex, ~${formatTonnesCo2(best.carbonReductionTco2e.mid)} tCO₂e/yr avoided, payback ${best.paybackYears.mid >= 999 ? "beyond horizon" : `~${formatNumber(best.paybackYears.mid, 1)} yr`}, score ${best.score.toFixed(3)}.`);
  }
  md.push("");
  md.push("## Baseline & data quality");
  md.push(`Coverage source labels: measured / entered / derived / modeled. Only **measured** or confidently **entered** values reduce model uncertainty; **modeled** values widen the ranges below.`);
  md.push("");
  md.push(coverageTable(input.coverage));
  md.push("");
  md.push("## Ranking & trade-offs");
  md.push(modeLines(input.mode));
  if (input.portfolios.length > 0) {
    md.push(portfolioTable(input.portfolios));
    md.push("");
    md.push("**Trade-offs to weigh before adopting:**");
    input.portfolios[0].tradeoffs.forEach((t, i) => md.push(`${i + 1}. ${t}`));
    md.push("");
    if (input.pareto && input.pareto.length > 1) {
      md.push("**Pareto front (capex vs carbon):** none of these bundles is dominated on both cost and carbon — pick along the curve by your priorities.");
      md.push("");
    }
  }
  md.push("## Assumptions & factors");
  md.push(`Calculations run with model **${MODEL_VERSION}** and factor registry **${FACTOR_VERSION}**.`);
  md.push("");
  md.push(factorsTable());
  md.push("");
  md.push("## SDG touchpoints");
  md.push("SDG tags describe which Sustainable Development Goals a bundle *touches* (mapping), not a measurement of SDG impact. Verify alignment with your institution's reporting standards before external claims.");
  md.push("");
  md.push("## Limitations & responsible-AI notes");
  md.push("- Savings are **scenario estimates**, not forecasts: they assume the catalog's published rates and listed prerequisites are met.");
  md.push("- Where baseline data was **derived or modeled**, numbers carry wider ranges and lower confidence.");
  md.push("- **No AI computed these numbers.** The copilot only explains, retrieves evidence and drafts narrative. Registered deterministic calculators produced every figure.");
  md.push("- **Human approval is required** before adoption; this document is a decision aid, not an instruction.");
  md.push("");
  md.push("## Decision trace");
  md.push(traceLines(input.trace));
  md.push("");
  md.push("---");
  md.push(`_TerraMind AI · explainable intervention-planning copilot · model ${MODEL_VERSION} · template ${REPORT_TEMPLATE_VERSION}_`);

  return {
    markdown: md.join("\n"),
    title: input.title,
    generatedAt: input.generatedAt,
    templateVersion: REPORT_TEMPLATE_VERSION,
    entity: input.entity,
  };
}