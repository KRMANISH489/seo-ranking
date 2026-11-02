import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface MonitorSite {
  id: string;
  url: string;
  clientEmail: string;
  clientName?: string;
  keywords: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  lastAuditId: string | null;
  lastScore: number | null;
  lastBestRank: number | null;
  weeklyReportsSent: number;
  notes?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "monitors.json");

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

async function readAll(): Promise<MonitorSite[]> {
  await ensure();
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as MonitorSite[];
  } catch {
    return [];
  }
}

async function writeAll(items: MonitorSite[]) {
  await ensure();
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function listMonitors(): Promise<MonitorSite[]> {
  return readAll();
}

export async function listActiveMonitors(): Promise<MonitorSite[]> {
  return (await readAll()).filter((m) => m.active);
}

export async function getMonitor(id: string): Promise<MonitorSite | null> {
  return (await readAll()).find((m) => m.id === id) || null;
}

export async function upsertMonitor(input: {
  url: string;
  clientEmail: string;
  clientName?: string;
  keywords: string[];
  active?: boolean;
  notes?: string;
}): Promise<MonitorSite> {
  const all = await readAll();
  const urlNorm = input.url.trim();
  const emailNorm = input.clientEmail.trim().toLowerCase();
  const existing = all.find(
    (m) => m.url === urlNorm && m.clientEmail.toLowerCase() === emailNorm
  );

  const now = new Date().toISOString();
  if (existing) {
    existing.keywords = [...new Set(input.keywords.map((k) => k.trim()).filter(Boolean))].slice(0, 5);
    existing.clientName = input.clientName || existing.clientName;
    existing.active = input.active ?? true;
    existing.updatedAt = now;
    existing.notes = input.notes ?? existing.notes;
    await writeAll(all);
    return existing;
  }

  const created: MonitorSite = {
    id: randomUUID(),
    url: urlNorm,
    clientEmail: emailNorm,
    clientName: input.clientName,
    keywords: [...new Set(input.keywords.map((k) => k.trim()).filter(Boolean))].slice(0, 5),
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
    lastRunAt: null,
    lastAuditId: null,
    lastScore: null,
    lastBestRank: null,
    weeklyReportsSent: 0,
    notes: input.notes,
  };
  all.unshift(created);
  await writeAll(all.slice(0, 500));
  return created;
}

export async function setMonitorActive(id: string, active: boolean): Promise<MonitorSite | null> {
  const all = await readAll();
  const m = all.find((x) => x.id === id);
  if (!m) return null;
  m.active = active;
  m.updatedAt = new Date().toISOString();
  await writeAll(all);
  return m;
}

export async function updateMonitorRun(
  id: string,
  patch: {
    lastAuditId: string;
    lastScore: number;
    lastBestRank: number | null;
  }
): Promise<void> {
  const all = await readAll();
  const m = all.find((x) => x.id === id);
  if (!m) return;
  m.lastRunAt = new Date().toISOString();
  m.lastAuditId = patch.lastAuditId;
  m.lastScore = patch.lastScore;
  m.lastBestRank = patch.lastBestRank;
  m.weeklyReportsSent += 1;
  m.updatedAt = m.lastRunAt;
  await writeAll(all);
}

export async function deleteMonitor(id: string): Promise<boolean> {
  const all = await readAll();
  await writeAll(all.filter((m) => m.id !== id));
  return true;
}
