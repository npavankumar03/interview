import { getOne, query } from "./db";

// Cache settings for 60 seconds to avoid constant DB hits
let settingsCache: Record<string, string> = {};
let cacheTime = 0;
const CACHE_TTL = 60_000;

export async function getSetting(key: string): Promise<string> {
  const now = Date.now();
  if (now - cacheTime > CACHE_TTL) {
    await refreshCache();
  }
  return settingsCache[key] || "";
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now - cacheTime > CACHE_TTL) {
    await refreshCache();
  }
  return { ...settingsCache };
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  );
  settingsCache[key] = value;
}

async function refreshCache() {
  try {
    const result = await query("SELECT key, value FROM app_settings");
    settingsCache = {};
    for (const row of result.rows) {
      settingsCache[row.key] = row.value;
    }
    cacheTime = Date.now();
  } catch {
    // DB might not be ready yet during build
  }
}
