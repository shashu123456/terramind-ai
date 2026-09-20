import { z } from "zod";
import { reportGenerateSchema } from "@terramind/shared";
import type { PortfolioResult } from "@terramind/shared";
import { modeComposite, listCatalog } from "@terramind/core";
import { protectedProcedure, router } from "../trpc/trpc";
import {
  generateDecisionPacket,
  REPORT_TEMPLATE_VERSION,
} from "../services/report";
import { siteProfile } from "../services/profile";

export const reportRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.store.listReports()),
  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.store.getReport(input.id);
      if (!row) return null;
      return { summary: row.report, markdown: row.markdown };
    }),
  generate: protectedProcedure
    .input(reportGenerateSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();

      if (input.kind === "scenario") {
        const scenario = await ctx.store.getScenario(input.scenarioId);
        if (!scenario) throw new Error("Scenario not found.");
        const batches = await ctx.store.listScenarioResults(scenario.id);
        const latest = batches.sort((a, b) => a.batch - b.batch).at(-1);
        const campuses = await ctx.store.listCampuses(ctx.user.workspaceId ?? null);
        const campus = campuses.find((c) => c.id === scenario.campusId) ?? null;
        const coverage = campus ? await ctx.store.getCoverage(campus.id) : [];
        const profile = await siteProfile(ctx.store, scenario.campusId);
        const mode = modeComposite(scenario.mode).def;
        const portfolios: PortfolioResult[] = latest?.portfolios ?? [];
        const leadSlug = portfolios[0]?.slugs[0];
        const lead = leadSlug ? listCatalog().find((e) => e.slug === leadSlug) ?? null : null;

        const packet = generateDecisionPacket({
          title: `Decision packet · ${scenario.name}`,
          generatedAt: now,
          entity: { kind: "scenario", id: scenario.id },
          campus,
          coverage,
          baseline: profile?.baseline,
          portfolios,
          pareto: undefined,
          mode,
          trace: null,
          topAction: lead ? { slug: lead.slug, title: lead.title } : undefined,
        });
        const report = await ctx.store.createReport({
          title: packet.title,
          markdown: packet.markdown,
          templateVersion: REPORT_TEMPLATE_VERSION,
          entity: { kind: "scenario", id: scenario.id },
        });
        return { report, packet };
      }

      if (input.kind === "trace") {
        const trace = await ctx.store.getTrace(input.traceId);
        if (!trace) throw new Error("Trace not found.");
        const packet = generateDecisionPacket({
          title: `Decision trace #${trace.id} · ${trace.kind}`,
          generatedAt: now,
          entity: { kind: "trace", id: trace.id },
          portfolios: [],
          mode: trace.mode ? modeComposite(trace.mode).def : null,
          trace,
        });
        const report = await ctx.store.createReport({
          title: packet.title,
          markdown: packet.markdown,
          templateVersion: REPORT_TEMPLATE_VERSION,
          entity: { kind: "trace", id: trace.id },
        });
        return { report, packet };
      }

      // campus readiness packet
      const profile = await siteProfile(ctx.store, input.campusId);
      if (!profile) throw new Error("Campus not found.");
      const packet = generateDecisionPacket({
        title: `Baseline readiness · ${profile.campus.name}`,
        generatedAt: now,
        entity: { kind: "campus", id: profile.campus.id },
        campus: profile.campus,
        coverage: profile.coverage,
        baseline: profile.baseline,
        portfolios: [],
        mode: null,
        trace: null,
      });
      const report = await ctx.store.createReport({
        title: packet.title,
        markdown: packet.markdown,
        templateVersion: REPORT_TEMPLATE_VERSION,
        entity: { kind: "campus", id: profile.campus.id },
      });
      return { report, packet };
    }),
});