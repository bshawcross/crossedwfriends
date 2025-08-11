import { promises as fs } from 'fs';
import path from 'path';

const memoryCache = new Map<string, unknown>();
const cacheDir = path.join(process.cwd(), '.cache');

async function readCacheFile<T>(filePath: string): Promise<T | undefined> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch {
    return undefined;
  }
}

export async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T | undefined> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }

  const filePath = path.join(cacheDir, `${key}.json`);
  const diskValue = await readCacheFile<T>(filePath);
  if (diskValue !== undefined) {
    memoryCache.set(key, diskValue);
    return diskValue;
  }

  try {
    const fresh = await fetcher();
    memoryCache.set(key, fresh);
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fresh));
    return fresh;
  } catch (e) {
    console.error(`Cache fetch failed for ${key}`, e);
    return undefined;
  }
}
