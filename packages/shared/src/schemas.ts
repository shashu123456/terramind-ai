import { z } from "zod";

export const metricKeys = ["energy", "water", "waste", "carbon"] as const;

export const dataQualitySchema = z.enum([
  "measured",
  "entered",
  "derived",
  "modeled",
  "not-available",
]);

export const decisionModeSchema = z.enum([
  "balanced",
  "carbon-first",
  "cost-first",
  "payback-first",
  "resilience-first",
]);

export const weightsSchema = z
  .object({
    carbon: z.number().min(0).max(1),
    cost: z.number().min(0).max(1),
    resilience: z.number().min(0).max(1),
  })
  .partial();

const positiveNumber = z.number().min(0);

export const campusInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100).default("India"),
  siteType: z.string().trim().min(1).max(100).default("campus"),
  areaSqm: positiveNumber.default(20000),
  occupancy: positiveNumber.int().default(1200),
});

export const baselineInputSchema = z.object({
  name: campusInputSchema.shape.name,
  city: campusInputSchema.shape.city,
  country: campusInputSchema.shape.country,
  areaSqm: campusInputSchema.shape.areaSqm,
  occupancy: campusInputSchema.shape.occupancy,
  gradient: z.boolean().optional(), // edit numbers directly instead of range-driven
  energyKwh: positiveNumber.optional(),
  energyQuality: dataQualitySchema.default("entered"),
  waterKl: positiveNumber.optional(),
  waterQuality: dataQualitySchema.default("entered"),
  wasteKg: positiveNumber.optional(),
  wasteQuality: dataQualitySchema.default("entered"),
  carbonTco2e: positiveNumber.optional(),
  carbonQuality: dataQualitySchema.default("derived"),
});

export type BaselineInput = z.infer<typeof baselineInputSchema>;

export const scenarioRunInputSchema = z.object({
  campusId: z.number().int().positive().optional(),
  baseline: z.object({
    annualEnergyKwh: positiveNumber,
    annualWaterKl: positiveNumber,
    annualWasteKg: positiveNumber,
    annualCarbonTco2e: positiveNumber.optional(),
    occupancy: z.number().int().positive(),
    areaSqm: positiveNumber,
  }),
  interventionSlugs: z.array(z.string().min(1)).min(1).max(24),
  budgetInr: positiveNumber.default(5000000),
  horizonYears: z.number().int().min(1).max(30).default(5),
  mode: decisionModeSchema.default("balanced"),
  weights: weightsSchema.optional(),
});

export type ScenarioRunInput = z.infer<typeof scenarioRunInputSchema>;

export const scenarioSaveInputSchema = scenarioRunInputSchema
  .omit({ baseline: true })
  .extend({
    campusId: z.number().int().positive(),
    name: z.string().trim().min(1).max(160),
    baseline: z.object({
      annualEnergyKwh: positiveNumber,
      annualWaterKl: positiveNumber,
      annualWasteKg: positiveNumber,
      annualCarbonTco2e: positiveNumber.optional(),
      occupancy: z.number().int().positive(),
      areaSqm: positiveNumber,
    }),
  });

export type ScenarioSaveInput = z.infer<typeof scenarioSaveInputSchema>;

export const copilotAskSchema = z.object({
  question: z.string().trim().min(3),
  campusId: z.number().int().positive().optional(),
  mode: decisionModeSchema.optional(),
});

export type CopilotAskInput = z.infer<typeof copilotAskSchema>;

export const reportGenerateSchema = z.union([
  z.object({ kind: z.literal("scenario"), scenarioId: z.number().int().positive() }),
  z.object({ kind: z.literal("trace"), traceId: z.number().int().positive() }),
  z.object({ kind: z.literal("campus"), campusId: z.number().int().positive() }),
]);

export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;

export const demoLoginSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
});