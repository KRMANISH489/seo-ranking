import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { AuditListItem, CompareResult, ProAuditResult } from "@/lib/seo/proTypes";
import { dataDir, ensureDataDir, readJsonFile, writeJsonFile } from "./paths";

function auditsDir() {
  return path.join(dataDir(), "audits");
}
function compareDir() {
  return path.join(dataDir(), "compares");
}
function indexFile() {
  return path.join(dataDir(), "index.json");
}

async function ensureDirs() {
  await ensureDataDir("audits", "compares");
  const idx = indexFile();
  try {
    await fs.access(idx);
  } catch {
    await writeJsonFile(idx, []);
  }
}

async function readIndex(): Promise<AuditListItem[]> {
  try {
    await ensureDirs();
    return await readJsonFile<AuditListItem[]>(indexFile(), []);
  } catch {
    return [];
  }
}

async function writeIndex(items: AuditListItem[]) {
  await ensureDirs();
  await writeJsonFile(indexFile(), items);
}

export async function saveAudit(audit: Omit<ProAuditResult, "id"> & { id?: string }): Promise<ProAuditResult> {
  await ensureDirs();
  const id = audit.id || randomUUID();
  const full: ProAuditResult = { ...audit, id };

  await writeJsonFile(path.join(auditsDir(), `${id}.json`), full);

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
  return readIndex();
}

export async function getAudit(id: string): Promise<ProAuditResult | null> {
  try {
    await ensureDirs();
    const raw = await fs.readFile(path.join(auditsDir(), `${id}.json`), "utf8");
    return JSON.parse(raw) as ProAuditResult;
  } catch {
    return null;
  }
}

export async function deleteAudit(id: string): Promise<boolean> {
  try {
    await ensureDirs();
    try {
      await fs.unlink(path.join(auditsDir(), `${id}.json`));
    } catch {
      // ignore missing file
    }
    const index = await readIndex();
    await writeIndex(index.filter((x) => x.id !== id));
  } catch {
    // ignore persistence errors on read-only hosts
  }
  return true;
}

export async function saveCompare(compare: Omit<CompareResult, "id" | "createdAt"> & { id?: string }): Promise<CompareResult> {
  await ensureDirs();
  const id = compare.id || randomUUID();
  const full: CompareResult = {
    ...compare,
    id,
    createdAt: new Date().toISOString(),
  };
  await writeJsonFile(path.join(compareDir(), `${id}.json`), full);
  return full;
}

export async function getCompare(id: string): Promise<CompareResult | null> {
  try {
    await ensureDirs();
    const raw = await fs.readFile(path.join(compareDir(), `${id}.json`), "utf8");
    return JSON.parse(raw) as CompareResult;
  } catch {
    return null;
  }
}
