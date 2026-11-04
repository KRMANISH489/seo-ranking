import { del, list, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { dataDir } from "./paths";

/**
 * Persistent JSON storage.
 * - Production (Vercel): Vercel Blob when BLOB_READ_WRITE_TOKEN is set
 * - Local / fallback: filesystem (data/ or /tmp)
 *
 * Without Blob on Vercel, /tmp is wiped between deploys — history/admin look empty.
 */
function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function blobPath(key: string): string {
  return `seo-analyzer/${key.replace(/^\/+/, "")}`;
}

async function fsPathFor(key: string): Promise<string> {
  const safe = key.replace(/^\/+/, "");
  const full = path.join(dataDir(), safe);
  await fs.mkdir(path.dirname(full), { recursive: true });
  return full;
}

export function storageMode(): "blob" | "filesystem" {
  return useBlob() ? "blob" : "filesystem";
}

export async function persistJson(key: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data);

  if (useBlob()) {
    await put(blobPath(key), body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return;
  }

  const file = await fsPathFor(key);
  await fs.writeFile(file, body, "utf8");
}

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    if (useBlob()) {
      const prefix = blobPath(key);
      const { blobs } = await list({
        prefix,
        limit: 20,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      // Exact match preferred (list is prefix-based)
      const hit =
        blobs.find((b) => b.pathname === prefix) ||
        blobs.find((b) => b.pathname.startsWith(prefix));
      if (!hit) return fallback;
      const res = await fetch(hit.url, { cache: "no-store" });
      if (!res.ok) return fallback;
      return (await res.json()) as T;
    }

    const file = await fsPathFor(key);
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function removeJson(key: string): Promise<void> {
  try {
    if (useBlob()) {
      const prefix = blobPath(key);
      const { blobs } = await list({
        prefix,
        limit: 20,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const targets = blobs.filter(
        (b) => b.pathname === prefix || b.pathname.startsWith(`${prefix}`)
      );
      await Promise.all(
        targets.map((b) => del(b.url, { token: process.env.BLOB_READ_WRITE_TOKEN }))
      );
      return;
    }
    const file = await fsPathFor(key);
    await fs.unlink(file);
  } catch {
    // ignore
  }
}

export async function listJsonKeys(prefix: string): Promise<string[]> {
  const clean = prefix.replace(/^\/+/, "");
  if (useBlob()) {
    const { blobs } = await list({
      prefix: blobPath(clean),
      limit: 500,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const base = `seo-analyzer/`;
    return blobs
      .map((b) => (b.pathname.startsWith(base) ? b.pathname.slice(base.length) : b.pathname))
      .filter((p) => p.endsWith(".json"));
  }

  try {
    const dir = path.join(dataDir(), clean);
    const names = await fs.readdir(dir);
    return names.filter((n) => n.endsWith(".json")).map((n) => path.join(clean, n).replace(/\\/g, "/"));
  } catch {
    return [];
  }
}
