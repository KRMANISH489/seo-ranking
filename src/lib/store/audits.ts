import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { AuditListItem, CompareResult, ProAuditResult } from "@/lib/seo/proTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const AUDITS_DIR = path.join(DATA_DIR, "audits");
const INDEX_FILE = path.join(DATA_DIR, "index.json");
const COMPARE_DIR = path.join(DATA_DIR, "compares");

async function ensureDirs() {
  await fs.mkdir(AUDITS_DIR, { recursive: true });
  await fs.mkdir(COMPARE_DIR, { recursive: true });
  try {
    await fs.access(INDEX_FILE);
  } catch {
    await fs.writeFile(INDEX_FILE, "[]", "utf8");
  }
}

async function readIndex(): Promise<AuditListItem[]> {
  await ensureDirs();
  const raw = await fs.readFile(INDEX_FILE, "utf8");
  try {
    return JSON.parse(raw) as AuditListItem[];
  } catch {
    return [];
  }
}

async function writeIndex(items: AuditListItem[]) {
  await ensureDirs();
  await fs.writeFile(INDEX_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function saveAudit(audit: Omit<ProAuditResult, "id"> & { id?: string }): Promise<ProAuditResult> {
  await ensureDirs();
  const id = audit.id || randomUUID();
  const full: ProAuditResult = { ...audit, id };

  await fs.writeFile(path.join(AUDITS_DIR, `${id}.json`), JSON.stringify(full, null, 2), "utf8");

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
  await ensureDirs();
  try {
    const raw = await fs.readFile(path.join(AUDITS_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as ProAuditResult;
  } catch {
    return null;
  }
}

export async function deleteAudit(id: string): Promise<boolean> {
  await ensureDirs();
  try {
    await fs.unlink(path.join(AUDITS_DIR, `${id}.json`));
  } catch {
    // ignore missing file
  }
  const index = await readIndex();
  await writeIndex(index.filter((x) => x.id !== id));
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
  await fs.writeFile(path.join(COMPARE_DIR, `${id}.json`), JSON.stringify(full, null, 2), "utf8");
  return full;
}

export async function getCompare(id: string): Promise<CompareResult | null> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(path.join(COMPARE_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as CompareResult;
  } catch {
    return null;
  }
}
