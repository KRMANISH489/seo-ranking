import { randomUUID } from "crypto";
import type { AuditListItem, CompareResult, ProAuditResult } from "@/lib/seo/proTypes";
import { listJsonKeys, loadJson, persistJson, removeJson, storageMode } from "./persist";

const INDEX_KEY = "index.json";

async function readIndex(): Promise<AuditListItem[]> {
  return loadJson<AuditListItem[]>(INDEX_KEY, []);
}

async function writeIndex(items: AuditListItem[]) {
  await persistJson(INDEX_KEY, items);
}

export async function saveAudit(
  audit: Omit<ProAuditResult, "id"> & { id?: string }
): Promise<ProAuditResult> {
  const id = audit.id || randomUUID();
  const full: ProAuditResult = { ...audit, id };

  await persistJson(`audits/${id}.json`, full);

  const index = await readIndex();
  const item: AuditListItem = {
    id,
    url: full.url,
    overallScore: full.overallScore,
    grade: full.grade,
    analyzedAt: full.analyzedAt,
    primaryKeyword: full.ai.primaryKeyword,
    summary: full.summary.slice(0, 180),
  };
  const next = [item, ...index.filter((x) => x.id !== id)].slice(0, 200);
  await writeIndex(next);
  return full;
}

export async function listAudits(): Promise<AuditListItem[]> {
  const index = await readIndex();
  if (index.length > 0) return index;

  // Rebuild index from blob/fs if index was lost but audit files remain
  const keys = await listJsonKeys("audits/");
  if (!keys.length) return [];

  const rebuilt: AuditListItem[] = [];
  for (const key of keys.slice(0, 200)) {
    const full = await loadJson<ProAuditResult | null>(key, null);
    if (!full?.id) continue;
    rebuilt.push({
      id: full.id,
      url: full.url,
      overallScore: full.overallScore,
      grade: full.grade,
      analyzedAt: full.analyzedAt,
      primaryKeyword: full.ai?.primaryKeyword ?? null,
      summary: (full.summary || "").slice(0, 180),
    });
  }
  rebuilt.sort((a, b) => +new Date(b.analyzedAt) - +new Date(a.analyzedAt));
  if (rebuilt.length) await writeIndex(rebuilt);
  return rebuilt;
}

export async function getAudit(id: string): Promise<ProAuditResult | null> {
  return loadJson<ProAuditResult | null>(`audits/${id}.json`, null);
}

export async function deleteAudit(id: string): Promise<boolean> {
  await removeJson(`audits/${id}.json`);
  const index = await readIndex();
  await writeIndex(index.filter((x) => x.id !== id));
  return true;
}

export async function saveCompare(
  compare: Omit<CompareResult, "id" | "createdAt"> & { id?: string }
): Promise<CompareResult> {
  const id = compare.id || randomUUID();
  const full: CompareResult = {
    ...compare,
    id,
    createdAt: new Date().toISOString(),
  };
  await persistJson(`compares/${id}.json`, full);
  return full;
}

export async function getCompare(id: string): Promise<CompareResult | null> {
  return loadJson<CompareResult | null>(`compares/${id}.json`, null);
}

export function getStorageMode() {
  return storageMode();
}
