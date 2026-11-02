import path from "path";
import { promises as fs } from "fs";

/** Vercel/serverless only allows writes under /tmp */
function baseDataDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "seo-analyzer-data");
  }
  return path.join(process.cwd(), "data");
}

export function dataDir(): string {
  return baseDataDir();
}

export async function ensureDataDir(...subdirs: string[]): Promise<string> {
  const root = baseDataDir();
  await fs.mkdir(root, { recursive: true });
  for (const sub of subdirs) {
    await fs.mkdir(path.join(root, sub), { recursive: true });
  }
  return root;
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
