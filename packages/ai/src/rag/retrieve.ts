import type { EvidenceEntry } from "./knowledge";
import { KNOWLEDGE_BASE } from "./knowledge";

export interface RetrievedEvidence {
  entry: EvidenceEntry;
  score: number;
}

/**
 * Lightweight lexical scoring over the curated evidence base.
 * Tokens from the query and any catalog slugs/tags are matched against each
 * entry's excerpt and tags. Deterministic and offline; kept deliberately
 * simple because the base is small and the real ranking happens upstream.
 */
export function retrieve(
  query: string,
  tags: string[] = [],
  limit = 4,
): RetrievedEvidence[] {
  const q = query.toLowerCase();
  const qTokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);

  const scored = KNOWLEDGE_BASE.map((entry) => {
    let score = 0;
    const hay = `${entry.title} ${entry.excerpt} ${entry.relevanceTags.join(" ")}`.toLowerCase();
    for (const tok of qTokens) {
      if (hay.includes(tok)) score += 1;
    }
    for (const tag of tags) {
      if (entry.relevanceTags.includes(tag.toLowerCase())) score += 2;
    }
    if (entry.id.includes("led") && /led|light/i.test(q)) score += 2;
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}