// TerraMind AI pitch deck generator (pptxgenjs).
// Run: node scripts/build-deck.mjs   (requires pptxgenjs resolvable — installs into a temp env)
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, "..", "node_modules/"));
let PptxGenJS;
try {
  PptxGenJS = require("pptxgenjs");
} catch {
  PptxGenJS = require("C:/Users/kavitha/AppData/Local/Temp/opencode/pptxenv/node_modules/pptxgenjs");
}

const OUT_DIR = resolve(__dirname, "..", "presentations");
mkdirSync(OUT_DIR, { recursive: true });
const OUT = resolve(OUT_DIR, "terramind-ai-pitch.pptx");

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "TerraMind AI";
pres.title = "TerraMind AI — Explainable intervention-planning copilot";

// ---- palette ----
const C = {
  brand: "172B3A",
  brandDeep: "0E1C26",
  brandMid: "2A4450",
  steel: "4C6B7D",
  blue: "0F62FE",
  blue700: "0A42C4",
  blueTint: "E9F1FF",
  canvas: "F7F9FB",
  card: "FFFFFF",
  ink: "172231",
  inkSoft: "5A6B7A",
  border: "D8E2E8",
  paleLine: "E4ECF1",
  paleBlue: "B9CCDC",
  paleBlueSoft: "8FA9BF",
  mint: "1E8E6E",
  mintTint: "E3F4EE",
  amber: "B07D2B",
  amberTint: "FBF3E3",
  red: "B42318",
  redTint: "FBE9E6",
};

const shadow = () => ({ type: "outer", color: C.brand, opacity: 0.14, blur: 7, angle: 90, distance: 2, offset: 2 });

function chip(slide, x, y, w, h, text, opts = {}) {
  slide.addText(text, {
    x, y, w, h, align: "center", valign: "middle",
    fontFace: "Arial", fontSize: opts.size ?? 11, bold: opts.bold ?? true,
    color: opts.color ?? C.ink, margin: 0, inset: 0, charSpacing: 0,
    shape: opts.fill ? "roundRect" : "roundRect",
    fill: { color: opts.fill ?? C.card },
    line: opts.line ? { color: opts.line, width: 1 } : (opts.noLine ? { type: "none" } : { color: C.border, width: 1 }),
    rectRadius: opts.radius ?? 0.16,
  });
}

function numOrb(slide, x, y, d, label, fill) {
  slide.addShape("OVAL", { x, y, w: d, h: d, fill: { color: fill ?? C.blue } });
  slide.addText(label, { x, y, w: d, h: d, align: "center", valign: "middle", fontFace: "Arial", fontSize: 14, bold: true, color: "FFFFFF", margin: 0 });
}

function header(slide, tag, title, titleColor) {
  slide.addText(tag, {
    x: 0.55, y: 0.42, w: 8, h: 0.3, fontFace: "Arial", fontSize: 10.5, bold: true,
    color: C.blue, charSpacing: 3, margin: 0,
  });
  slide.addText(title, {
    x: 0.55, y: 0.72, w: 12.2, h: 0.62, fontFace: "Arial", fontSize: 27, bold: true,
    color: titleColor ?? C.ink, margin: 0,
  });
}

function footer(slide, n) {
  slide.addText(`TerraMind AI · v1.0.0 · ${String(n).padStart(2, "0")}`, {
    x: 0.55, y: 7.05, w: 5, h: 0.3, fontFace: "Arial", fontSize: 9, color: C.inkSoft, charSpacing: 1, margin: 0,
  });
}

function light(slide) {
  slide.background = { color: C.canvas };
  return slide;
}

function bodyBox(slide, x, y, w, h, lines) {
  slide.addShape("roundRect", { x, y, w, h, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.06, shadow: shadow() });
  slide.addText(lines, { x: x + 0.3, y: y + 0.3, w: w - 0.6, h: h - 0.6, fontFace: "Arial", fontSize: 12.5, color: C.inkSoft, valign: "top", margin: 0, paraSpaceAfter: 6, lineSpacingMultiple: 1.15 });
}

// ============================================================ SLIDE 1 — TITLE (dark)
{
  const s = pres.addSlide();
  s.background = { color: C.brand };
  s.addShape("roundRect", { x: -1.2, y: -1.4, w: 5.4, h: 5.4, fill: { color: C.brandDeep }, line: { type: "none" }, rectRadius: 1, rotate: 18 });
  s.addShape("roundRect", { x: 11.0, y: 4.9, w: 4.4, h: 4.4, fill: { color: C.brandDeep }, line: { type: "none" }, rectRadius: 1, rotate: -14 });

  // logomark
  s.addShape("roundRect", { x: 0.55, y: 0.5, w: 0.92, h: 0.92, fill: { color: C.blue }, line: { type: "none" }, rectRadius: 0.16 });
  s.addText("T", { x: 0.55, y: 0.5, w: 0.92, h: 0.92, align: "center", valign: "middle", fontFace: "Arial", fontSize: 26, bold: true, color: "FFFFFF", margin: 0 });
  s.addText("TerraMind AI", { x: 1.65, y: 0.5, w: 6, h: 0.5, fontFace: "Arial", fontSize: 21, bold: true, color: "FFFFFF", margin: 0 });
  s.addText("CAMPUS SUSTAINABILITY INTELLIGENCE", { x: 1.67, y: 0.97, w: 8, h: 0.3, fontFace: "Arial", fontSize: 9.5, color: C.paleBlue, charSpacing: 2.5, margin: 0 });

  s.addText("Explainable intervention-planning\ncopilot for campuses", {
    x: 0.55, y: 2.05, w: 11.3, h: 1.6, fontFace: "Arial", fontSize: 36, bold: true, color: "FFFFFF", margin: 0, lineSpacingMultiple: 1.05, valign: "middle",
  });
  s.addText("Scenario estimates you can defend · decision traces you can audit · fully offline, no API keys.",
    { x: 0.57, y: 3.75, w: 11, h: 0.5, fontFace: "Arial", fontSize: 15, color: C.paleBlue, margin: 0 });

  const pills = ["12 interventions", "5 ranking modes", "16 evidence sources", "no API keys required"];
  let px = 0.55;
  for (const p of pills) {
    const w = p.length * 0.085 + 0.5;
    chip(s, px, 5.0, w, 0.44, p, { color: "FFFFFF", line: C.steel, fill: C.brandMid, size: 10.5 });
    px += w + 0.22;
  }
  s.addText("MIT licensed · v1.0.0 · 2026", { x: 0.57, y: 6.9, w: 6, h: 0.3, fontFace: "Arial", fontSize: 10, color: C.paleBlueSoft, charSpacing: 1, margin: 0 });
}

// ============================================================ SLIDE 2 — PROBLEM
{
  const s = pres.addSlide();
  light(s);
  header(s, "PROBLEM", "Why campus sustainability plans stall");
  const cards = [
    { t: "Black-box models", b: "Reviewers cannot interrogate the assumptions a number is built on — so they cannot approve it.", fill: C.blue },
    { t: "\u201CForecasts\u201D oversell", b: "\u201CPredicted savings\u201D reads like a promise. When reality diverges, the whole plan loses credibility.", fill: C.blue },
    { t: "SDG claims overstate", b: "Tags turn into measurements. A campus gets credit as if it already did the work.", fill: C.mint },
    { t: "Start over every year", b: "New spreadsheet, new analyst, same opaque result. Nothing accumulates — no learning curve.", fill: C.amber },
  ];
  const pos = [[0.55, 1.6], [6.7, 1.6], [0.55, 4.1], [6.7, 4.1]];
  cards.forEach((c, i) => {
    const [x, y] = pos[i];
    s.addShape("roundRect", { x, y, w: 6.08, h: 2.3, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.05, shadow: shadow() });
    numOrb(s, x + 0.32, y + 0.32, 0.56, String(i + 1), c.fill);
    s.addText(c.t, { x: x + 0.32, y: y + 1.05, w: 5.4, h: 0.42, fontFace: "Arial", fontSize: 16.5, bold: true, color: C.ink, margin: 0 });
    s.addText(c.b, { x: x + 0.32, y: y + 1.5, w: 5.45, h: 0.7, fontFace: "Arial", fontSize: 12.5, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.15 });
  });
  footer(s, 2);
}

// ============================================================ SLIDE 3 — THE PRINCIPLE
{
  const s = pres.addSlide();
  light(s);
  header(s, "THE PRINCIPLE", "The AI explains. The engine calculates. The trace is accountable.");
  s.addShape("roundRect", { x: 0.55, y: 1.62, w: 12.23, h: 0.9, fill: { color: C.blueTint }, line: { type: "none" }, rectRadius: 0.05 });
  s.addText("Every number in TerraMind AI is produced by registered, deterministic calculators with versioned factors — never by the language model.",
    { x: 0.85, y: 1.62, w: 11.65, h: 0.9, fontFace: "Arial", fontSize: 15, color: C.blue700, bold: true, margin: 0, valign: "middle" });

  const cols = [
    { t: "Model", d: "Deterministic engine: a factor registry, a 12-action catalog, energy/water/waste/carbon calculators and a portfolio optimizer.", f: "every result carries formula · unit · factor version" },
    { t: "Explain", d: "The copilot retrieves evidence, explains reasoning and drafts prose. It never computes a number on its own.", f: "RAG over 16 evidence sources · citations on every claim" },
    { t: "Decide", d: "A decision trace records inputs, versions, weights, citations and approvals — a handover packet humans can sign.", f: "approval gate before adoption" },
  ];
  const xs = [0.55, 4.72, 8.89];
  cols.forEach((c, i) => {
    const x = xs[i];
    bodyBox(s, x, 2.78, 3.89, 3.75, c.d);
    numOrb(s, x + 0.32, 3.1, 0.56, String(i + 1), C.blue);
    s.addText(c.t, { x: x + 1.02, y: 3.17, w: 2.6, h: 0.42, fontFace: "Arial", fontSize: 18, bold: true, color: C.ink, margin: 0 });
    s.addText(c.f, { x: x + 0.32, y: 5.62, w: 3.35, h: 0.6, fontFace: "Arial", fontSize: 10.5, italic: true, color: C.steel, margin: 0, lineSpacingMultiple: 1.1 });
  });
  footer(s, 3);
}

// ============================================================ SLIDE 4 — POSITIONING
{
  const s = pres.addSlide();
  light(s);
  header(s, "POSITIONING", "The decision layer, not the dashboard");
  s.addShape("roundRect", { x: 0.55, y: 1.55, w: 5.95, h: 1.25, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.05 });
  s.addShape("roundRect", { x: 6.72, y: 1.55, w: 6.06, h: 1.25, fill: { color: C.blueTint }, line: { color: C.blue, width: 1.25 }, rectRadius: 0.05 });
  s.addText("ESG dashboards & reporting platforms", { x: 0.85, y: 1.8, w: 5.4, h: 0.42, fontFace: "Arial", fontSize: 15, bold: true, color: C.inkSoft, margin: 0 });
  s.addText("TerraMind AI", { x: 7.02, y: 1.8, w: 5.4, h: 0.42, fontFace: "Arial", fontSize: 15, bold: true, color: C.blue700, margin: 0 });

  const rows = [
    ["Primary question", "How are we trending?", "What should we do next?"],
    ["Data posture", "Warehouses the data you already have", "Local baseline + explicit, versioned assumptions"],
    ["Primary output", "Reports and scorecards", "A rank-ordered, costed action bundle"],
    ["AI\u2019s role", "Generates charts", "Explains and reasons from the engine"],
    ["What you walk away with", "A score", "A decision packet you can approve"],
  ];
  const colW = [2.5, 4.9, 4.83];
  const tbl = rows.map((r, i) =>
    r.map((cell, j) => ({
      text: cell,
      options: {
        fontFace: "Arial",
        fontSize: j === 0 ? 11.5 : 12.5,
        bold: j === 0 || i === 0 ? true : false,
        color: j === 0 ? C.steel : (i === 0 ? "FFFFFF" : C.ink),
        fill: i === 0 ? C.brand : (r[0] === "TerraMind AI" ? C.blueTint : (i % 2 ? C.canvas : C.card)),
        align: "left",
        valign: "middle",
        margin: [0.08, 0.14, 0.08, 0.14],
      },
    })),
  );
  s.addTable(tbl, {
    x: 0.55, y: 3.0, w: 12.23, colW,
    rowH: 0.58,
    border: { type: "solid", pt: 0.5, color: C.paleLine },
    fontFace: "Arial",
    margin: 0.02,
  });
  footer(s, 4);
}

// ============================================================ SLIDE 5 — ENGINE
{
  const s = pres.addSlide();
  light(s);
  header(s, "DETERMINISTIC ENGINE", "Numbers with provenance");
  const steps = [
    { t: "Factor registry", d: "7 India factors", sub: "grid 0.7 kgCO\u2082e/kWh \u00B7 tariff \u20B97.5/kWh \u00B7 factor v1" },
    { t: "Intervention catalog", d: "12 actions", sub: "rates \u00B7 capex \u00B7 confidence \u00B7 prerequisites \u00B7 SDG tags" },
    { t: "Calculators", d: "energy \u00B7 water \u00B7 waste \u00B7 carbon \u00B7 payback", sub: "ranges, never point guesses" },
    { t: "Portfolio optimizer", d: "5 modes + Pareto", sub: "exhaustive \u2264 2,048 bundles \u00B7 top 8 + non-dominated front" },
  ];
  const w = 2.8, gap = 0.22;
  steps.forEach((st, i) => {
    const x = 0.55 + i * (w + gap);
    bodyBox(s, x, 1.7, w, 3.1, st.d);
    numOrb(s, x + 0.3, 2.0, 0.52, String(i + 1), C.blue);
    s.addText(st.t, { x: x + 0.3, y: 2.68, w: w - 0.6, h: 0.4, fontFace: "Arial", fontSize: 15.5, bold: true, color: C.ink, margin: 0 });
    s.addText(st.sub, { x: x + 0.3, y: 4.2, w: w - 0.6, h: 0.5, fontFace: "Arial", fontSize: 9.8, italic: true, color: C.steel, margin: 0, lineSpacingMultiple: 1.1 });
    if (i < 3) {
      s.addText("\u2192", { x: x + w + 0.015, y: 3.0, w: gap - 0.03, h: 0.4, align: "center", fontFace: "Arial", fontSize: 20, bold: true, color: C.blue, margin: 0 });
    }
  });
  s.addShape("roundRect", { x: 0.55, y: 5.15, w: 12.23, h: 0.85, fill: { color: C.mintTint }, line: { type: "none" }, rectRadius: 0.05 });
  s.addText("Uncertainty is carried, not hidden: every estimate is a low\u2013high range whose width reflects data completeness, and the whole pipeline is reproducible from the recorded inputs.",
    { x: 0.85, y: 5.15, w: 11.6, h: 0.85, fontFace: "Arial", fontSize: 13.5, color: C.mint, bold: true, valign: "middle", margin: 0 });
  footer(s, 5);
}

// ============================================================ SLIDE 6 — RANKING MODES (chart)
{
  const s = pres.addSlide();
  light(s);
  header(s, "MULTI-OBJECTIVE RANKING", "Five modes, visible weights");
  s.addText([
    { text: "Every ranking is a weighted sum of named objectives \u2014 and the weights are printed in the result.", options: { bullet: false, breakLine: true } },
    { text: "No hidden 'recommended bundle': up to eight bundles are ranked on a transparent score, and the Pareto front shows alternatives a committee might prefer even when they are not top of the list.", options: { bullet: false } },
  ], { x: 0.55, y: 1.65, w: 6.0, h: 2.2, fontFace: "Arial", fontSize: 12.5, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.2, paraSpaceAfter: 8 });
  s.addText([
    { text: "balanced", options: { breakLine: true } },
    { text: "carbon-first", options: { breakLine: true } },
    { text: "cost-first", options: { breakLine: true } },
    { text: "payback-first", options: { breakLine: true } },
    { text: "resilience-first", options: {} },
  ], { x: 0.55, y: 3.95, w: 6.0, h: 1.7, fontFace: "Arial", fontSize: 11.5, bold: true, color: C.steel, margin: 0, lineSpacingMultiple: 1.5 });

  s.addChart("bar", [
    { name: "carbon weighting %", labels: ["Balanced", "Carbon-first", "Cost-first", "Payback-first", "Resilience-first"], values: [50, 100, 20, 20, 20] },
    { name: "cost weighting %", labels: ["", "", "", "", ""], values: [25, 0, 70, 60, 20] },
    { name: "resilience weighting %", labels: ["", "", "", "", ""], values: [25, 0, 10, 20, 60] },
  ], {
    x: 6.9, y: 1.6, w: 6.0, h: 4.3,
    barDir: "col", barGrouping: "stacked",
    chartColors: [C.blue, "8FB6DD", C.brand],
    showLegend: true, legendPos: "b", legendFontSize: 10, legendColor: C.inkSoft,
    valAxisMaxVal: 100, valAxisMinVal: 0, valAxisLabelColor: C.inkSoft, valAxisLabelFontSize: 9,
    valGridLine: { color: C.paleLine, size: 0.5 },
    catAxisLabelColor: C.ink, catAxisLabelFontSize: 10, catAxisLabelRotation: -30,
    catGridLine: { style: "none" },
    showValue: false, showTitle: true, title: "Objective weights by mode (%)", titleColor: C.ink, titleFontSize: 12, titleFontFace: "Arial",
  });
  footer(s, 6);
}

// ============================================================ SLIDE 7 — COPILOT
{
  const s = pres.addSlide();
  light(s);
  header(s, "THE COPILOT", "Explains. Never invents.");
  const steps = [
    { t: "Guardrails", d: "Rejects forecasts, guarantees and 'certified savings' phrasing." },
    { t: "Grounding", d: "Retrieves and cites evidence filtered by intervention and geography." },
    { t: "Reasoning", d: "Calls the deterministic engine for every figure it shows." },
    { t: "Labelling", d: "Labels every answer a 'scenario estimate' with its range." },
  ];
  const w = 2.85, gap = 0.16;
  steps.forEach((st, i) => {
    const x = 0.55 + i * (w + gap);
    s.addShape("roundRect", { x, y: 1.75, w, h: 2.25, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.05, shadow: shadow() });
    numOrb(s, x + 0.28, 2.0, 0.5, String(i + 1), C.blue);
    s.addText(st.t, { x: x + 0.28, y: 2.66, w: w - 0.56, h: 0.4, fontFace: "Arial", fontSize: 15, bold: true, color: C.ink, margin: 0 });
    s.addText(st.d, { x: x + 0.28, y: 3.08, w: w - 0.56, h: 0.8, fontFace: "Arial", fontSize: 11.5, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.15 });
    if (i < 3) s.addText("\u2192", { x: x + w + 0.01, y: 2.6, w: gap - 0.02, h: 0.4, align: "center", fontFace: "Arial", fontSize: 17, bold: true, color: C.blue, margin: 0 });
  });

  s.addShape("roundRect", { x: 0.55, y: 4.35, w: 12.23, h: 1.55, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.05, shadow: shadow() });
  s.addText("Retrieved evidence", { x: 0.85, y: 4.6, w: 4, h: 0.35, fontFace: "Arial", fontSize: 12.5, bold: true, color: C.ink, margin: 0 });
  const cites = ["\u201CLED Lighting Fact Sheet\u201D \u00B7 US Department of Energy", "\u201CLighting Retrofit Best Practices\u201D \u00B7 BEE India", "\u201CISO 50001 Energy Management\u201D \u00B7 ISO"];
  let cy = 5.05;
  for (const c of cites) {
    s.addText("\u2022  " + c, { x: 0.85, y: cy, w: 11, h: 0.3, fontFace: "Arial", fontSize: 11.5, color: C.steel, margin: 0 });
    cy += 0.28;
  }
  s.addText("Citations are verifiable URLs \u2014 an AI can point to its sources, an engine never has to.", {
    x: 0.85, y: 6.42, w: 11.6, h: 0.32, fontFace: "Arial", fontSize: 11, italic: true, color: C.blue700, margin: 0,
  });
  footer(s, 7);
}

// ============================================================ SLIDE 8 — DECISION TRACE
{
  const s = pres.addSlide();
  light(s);
  header(s, "EXPLAINABLE RECOMMENDATIONS", "One decision, one auditable trace");
  s.addText([
    { text: "Every scenario run and every copilot answer writes a DecisionTrace.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "It records the input hash (SHA-256), model and factor versions, weights, citations and a full snapshot.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "Approvals and rejections are appended as their own trace events.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "Nothing a reviewer sees is unverifiable \u2014 reproduce the run, get the same numbers.", options: { bullet: { code: "2022" } } },
  ], { x: 0.55, y: 1.7, w: 6.6, h: 2.4, fontFace: "Arial", fontSize: 13.5, color: C.ink, margin: 0, paraSpaceAfter: 12, lineSpacingMultiple: 1.25 });

  s.addShape("roundRect", { x: 7.55, y: 1.6, w: 5.2, h: 4.5, fill: { color: C.brand }, line: { type: "none" }, rectRadius: 0.06, shadow: shadow() });
  s.addText("DECISION TRACE \u00B7 #49", { x: 7.85, y: 1.85, w: 4.6, h: 0.35, fontFace: "Arial", fontSize: 11, bold: true, color: C.paleBlue, charSpacing: 2, margin: 0 });
  const traceRows = [
    ["kind", "scenario run"],
    ["input hash", "7f3a\u2026c9b2"],
    ["model", "campus-interventions-v1.0"],
    ["factors", "india-demo-factors-v1.0"],
    ["weights", "carbon .50 \u00B7 cost .25 \u00B7 res .25"],
    ["citations", "3 evidence sources"],
    ["status", "pending approval"],
  ];
  let ry = 2.28;
  traceRows.forEach(([k, v]) => {
    s.addText(k, { x: 7.85, y: ry, w: 1.5, h: 0.32, fontFace: "Arial", fontSize: 10.5, color: C.paleBlueSoft, margin: 0 });
    s.addText(v, { x: 9.45, y: ry, w: 3.1, h: 0.32, fontFace: "Arial", fontSize: 10.5, bold: true, color: "FFFFFF", margin: 0 });
    ry += 0.42;
  });
  chip(s, 7.85, 5.32, 1.6, 0.42, "Approve", { color: "FFFFFF", fill: C.mint, line: C.mint });
  chip(s, 9.65, 5.32, 1.6, 0.42, "Reject", { color: "FFFFFF", fill: C.red, line: C.red });
  s.addText("Inputs, versions and outcomes stay linked forever \u2014 your audit trail for the next committee.", {
    x: 0.55, y: 4.5, w: 6.6, h: 0.8, fontFace: "Arial", fontSize: 12.5, italic: true, color: C.steel, margin: 0, lineSpacingMultiple: 1.2,
  });
  footer(s, 8);
}

// ============================================================ SLIDE 9 — DECISION PACKET
{
  const s = pres.addSlide();
  light(s);
  header(s, "THE HANDOVER", "A decision packet, not a dashboard");
  s.addShape("roundRect", { x: 0.55, y: 1.65, w: 6.5, h: 4.5, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.05, shadow: shadow() });
  s.addText("# Decision packet \u00B7 Campus LED + Solar", { x: 0.85, y: 1.9, w: 5.9, h: 0.4, fontFace: "Arial", fontSize: 14, bold: true, color: C.ink, margin: 0 });
  s.addShape("roundRect", { x: 0.85, y: 2.45, w: 5.9, h: 0.5, fill: { color: C.amberTint }, line: { type: "none" }, rectRadius: 0.04 });
  s.addText("\u26A0  scenario estimate \u2014 not a forecast", { x: 0.85, y: 2.45, w: 5.9, h: 0.5, fontFace: "Arial", fontSize: 11.5, bold: true, color: C.amber, margin: 0, valign: "middle" });
  const secs = ["Executive summary", "Baseline & data quality", "Ranking & trade-offs", "Assumptions & factors", "SDG touchpoints", "Limitations & responsible-AI"];
  let sy = 3.15;
  for (const sec of secs) {
    s.addText("\u2013  " + sec, { x: 0.85, y: sy, w: 5.9, h: 0.34, fontFace: "Arial", fontSize: 12, color: C.steel, margin: 0 });
    sy += 0.44;
  }

  s.addText([
    { text: "A single markdown document a committee can read in ten minutes \u2014 and approve in one.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "Contains only structured values produced by the engine \u2014 the AI writes prose, never numbers.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "Bundles the sequenced action plan, the ranges and the responsible-AI notes.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "PDF-ready today; the template is versioned for changes you can inspect.", options: { bullet: { code: "2022" } } },
  ], { x: 7.45, y: 2.0, w: 5.35, h: 3.4, fontFace: "Arial", fontSize: 13, color: C.ink, margin: 0, paraSpaceAfter: 13, lineSpacingMultiple: 1.22 });

  s.addShape("roundRect", { x: 7.45, y: 5.1, w: 5.35, h: 1.05, fill: { color: C.blueTint }, line: { type: "none" }, rectRadius: 0.05 });
  s.addText("gen \u2192 approval \u2192 adoption: the packet is the handover record, and it is traceable to every input.",
    { x: 7.75, y: 5.1, w: 4.75, h: 1.05, fontFace: "Arial", fontSize: 12, italic: true, color: C.blue700, valign: "middle", margin: 0, lineSpacingMultiple: 1.15 });
  footer(s, 9);
}

// ============================================================ SLIDE 10 — DATA HONESTY
{
  const s = pres.addSlide();
  light(s);
  header(s, "INTEGRITY", "Honest labels, honest ranges");
  const rows = [
    ["Metric", "Annual value", "Label", "Source"],
    ["Electricity", "100,000 kWh", "entered", "annual bill, FY 2025\u201326"],
    ["Water", "10,000 kL", "entered", "utility statement"],
    ["Waste", "20,000 kg", "entered", "waste audit estimate"],
    ["Carbon", "\u224870 t CO\u2082e", "derived", "grid factor 0.7 kgCO\u2082e/kWh"],
  ];
  const colW = [2.2, 2.6, 2.2, 5.2];
  const tbl = rows.map((r, i) =>
    r.map((cell, j) => ({
      text: cell,
      options: {
        fontFace: "Arial",
        fontSize: j === 3 && i > 0 ? 11 : 12,
        bold: i === 0,
        color: i === 0 ? "FFFFFF" : (j === 2 ? (cell === "derived" ? C.blue700 : C.ink) : C.ink),
        fill: i === 0 ? C.brand : (i % 2 ? C.canvas : C.card),
        valign: "middle",
        margin: [0.08, 0.14, 0.08, 0.14],
      },
    })),
  );
  s.addTable(tbl, { x: 0.55, y: 1.65, w: 12.23, colW, rowH: 0.52, border: { type: "solid", pt: 0.5, color: C.paleLine }, fontFace: "Arial", margin: 0.02 });

  s.addText([
    { text: "Five labels: measured \u00B7 entered \u00B7 derived \u00B7 modeled \u00B7 not-available.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "Missing data widens the range \u2014 it is never silently imputed.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "Measured and modeled values are never conflated.", options: { bullet: { code: "2022" }, breakLine: true } },
    { text: "SDG tags are described as mappings, not measurements of impact.", options: { bullet: { code: "2022" } } },
  ], { x: 0.55, y: 4.4, w: 12.2, h: 1.9, fontFace: "Arial", fontSize: 13.5, color: C.ink, margin: 0, paraSpaceAfter: 11, lineSpacingMultiple: 1.2 });
  footer(s, 10);
}

// ============================================================ SLIDE 11 — TECH STACK
{
  const s = pres.addSlide();
  light(s);
  header(s, "TECHNOLOGY", "Built to run where you run");
  const tiles = [
    ["pnpm monorepo", "6 workspace packages \u00B7 one-way deps"],
    ["TypeScript 5.9", "strict \u00B7 ESM \u00B7 zero implicit any"],
    ["tRPC v11 + superjson", "typed end-to-end API \u00B7 one endpoint"],
    ["React 19 \u00B7 Vite 7 \u00B7 Tailwind 4", "Carbon-inspired UI \u00B7 light + dark"],
    ["Drizzle ORM + MySQL 8", "9 tables \u00B7 JSON demo store"],
    ["Deterministic core", "ES2022 \u00B7 pure functions \u00B7 zod v4 inputs"],
    ["JWT sessions (jose)", "HttpOnly cookie \u00B7 SameSite=Lax"],
    ["Vitest \u00B7 esbuild", "41 tests \u00B7 66 KB API bundle"],
  ];
  tiles.forEach((t, i) => {
    const x = 0.55 + (i % 4) * 3.13;
    const y = 1.7 + Math.floor(i / 4) * 2.0;
    s.addShape("roundRect", { x, y, w: 2.95, h: 1.75, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.05, shadow: shadow() });
    s.addText(t[0], { x: x + 0.25, y: y + 0.3, w: 2.45, h: 0.7, fontFace: "Arial", fontSize: 13.5, bold: true, color: C.ink, margin: 0, lineSpacingMultiple: 1.05, valign: "top" });
    s.addText(t[1], { x: x + 0.25, y: y + 1.1, w: 2.45, h: 0.5, fontFace: "Arial", fontSize: 10.5, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.1 });
  });
  chip(s, 0.55, 5.62, 8.1, 0.5, "Runs fully offline \u00B7 no API keys \u00B7 demo store \u2192 production MySQL in one switch", { color: C.blue700, fill: C.blueTint, line: C.blueTint, size: 12 });
  footer(s, 11);
}

// ============================================================ SLIDE 12 — DEPLOYMENT
{
  const s = pres.addSlide();
  light(s);
  header(s, "DELIVERY", "One command from demo to production");
  const steps = [
    { t: "pnpm dev", d: "Local demo server with a zero-setup JSON store \u2014 instant onboarding.", tag: "10 seconds to first run" },
    { t: "pnpm build && start", d: "Single Node process: SPA + typed API from one port, ready for a VM.", tag: "one binary, 66 KB engine" },
    { t: "docker compose up", d: "API + MySQL 8 with healthchecks \u2014 the same code, containerised.", tag: "drop-in for institutional IT" },
  ];
  const w = 3.85, gap = 0.18;
  steps.forEach((st, i) => {
    const x = 0.55 + i * (w + gap);
    bodyBox(s, x, 1.7, w, 3.0, st.d);
    numOrb(s, x + 0.3, 2.0, 0.56, String(i + 1), C.blue);
    s.addText(st.t, { x: x + 1.0, y: 2.05, w: 2.7, h: 0.42, fontFace: "Arial", fontSize: 16.5, bold: true, color: C.ink, margin: 0 });
    s.addText(st.tag, { x: x + 0.3, y: 4.05, w: w - 0.6, h: 0.4, fontFace: "Arial", fontSize: 10.5, italic: true, color: C.blue700, margin: 0 });
  });
  s.addShape("roundRect", { x: 0.55, y: 5.15, w: 12.23, h: 0.85, fill: { color: C.blueTint }, line: { type: "none" }, rectRadius: 0.05 });
  s.addText("No external LLM, no cloud account, no data export \u2014 the demo is the product, just without the credentials.",
    { x: 0.85, y: 5.15, w: 11.6, h: 0.85, fontFace: "Arial", fontSize: 13.5, color: C.blue700, bold: true, valign: "middle", margin: 0 });
  footer(s, 12);
}

// ============================================================ SLIDE 13 — ROADMAP
{
  const s = pres.addSlide();
  light(s);
  header(s, "ROADMAP", "From a single campus to an institutional portfolio");
  const cols = [
    { t: "Near term", fill: C.blue, items: ["Production auth provider", "Remote LLM toggle (Granite / OpenAI / Ollama)", "PDF decision packets", "Multi-site portfolio views"] },
    { t: "Medium term", fill: C.mint, items: ["Postgres store", "Time-series baselines & seasonality", "Structured scenario diffing", "Shared-factor governance"] },
    { t: "Longer term", fill: C.amber, items: ["On-field verification loop feeding the factor registry", "Community factor packs", "i18n on the evidence base"] },
  ];
  const xs = [0.55, 4.72, 8.89];
  cols.forEach((c, i) => {
    const x = xs[i];
    s.addShape("roundRect", { x, y: 1.7, w: 3.89, h: 4.4, fill: { color: C.card }, line: { color: C.border, width: 1 }, rectRadius: 0.05, shadow: shadow() });
    s.addShape("OVAL", { x: x + 0.32, y: 2.0, w: 0.5, h: 0.5, fill: { color: c.fill } });
    s.addText(c.t, { x: x + 0.95, y: 2.06, w: 2.7, h: 0.4, fontFace: "Arial", fontSize: 15.5, bold: true, color: C.ink, margin: 0 });
    c.items.forEach((it, j) => {
      s.addText("\u2013  " + it, { x: x + 0.32, y: 2.85 + j * 0.78, w: 3.3, h: 0.7, fontFace: "Arial", fontSize: 12, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.12 });
    });
  });
  footer(s, 13);
}

// ============================================================ SLIDE 14 — CLOSING (dark)
{
  const s = pres.addSlide();
  s.background = { color: C.brand };
  s.addShape("roundRect", { x: 10.6, y: -1.2, w: 4.6, h: 4.6, fill: { color: C.brandDeep }, line: { type: "none" }, rectRadius: 1, rotate: 16 });
  s.addShape("roundRect", { x: -1.0, y: 5.2, w: 4.4, h: 4.4, fill: { color: C.brandMid }, line: { type: "none" }, rectRadius: 1, rotate: -12 });

  s.addText("Turn numbers into decisions\nyour committee can sign.", {
    x: 0.9, y: 2.05, w: 11.5, h: 1.7, fontFace: "Arial", fontSize: 34, bold: true, color: "FFFFFF", margin: 0, lineSpacingMultiple: 1.08,
  });
  s.addText("TerraMind AI \u2014 explainable intervention-planning copilot for campuses and institutional sites. Runs locally today; scales to institutional portfolios tomorrow.",
    { x: 0.92, y: 3.9, w: 9.6, h: 0.9, fontFace: "Arial", fontSize: 14.5, color: C.paleBlue, margin: 0, lineSpacingMultiple: 1.2, valign: "top" });

  chip(s, 0.9, 5.35, 2.4, 0.48, "MIT licensed", { color: "FFFFFF", fill: C.brandMid, line: C.steel });
  chip(s, 3.45, 5.35, 2.4, 0.48, "Offline demo included", { color: "FFFFFF", fill: C.brandMid, line: C.steel });
  chip(s, 6.0, 5.35, 2.4, 0.48, "Decision traces, first-class", { color: "FFFFFF", fill: C.brandMid, line: C.steel });
  s.addText("TerraMind AI \u00B7 v1.0.0 \u00B7 2026", { x: 0.92, y: 6.85, w: 6, h: 0.3, fontFace: "Arial", fontSize: 10, color: C.paleBlueSoft, charSpacing: 1, margin: 0 });
}

pres.writeFile({ fileName: OUT }).then(() => console.log("WROTE", OUT)).catch((e) => { console.error(e); process.exit(1); });