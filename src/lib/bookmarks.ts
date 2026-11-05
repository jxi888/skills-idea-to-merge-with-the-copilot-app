// Pure helpers for the bookmarks feature. No browser APIs are touched here,
// so they are safe to import anywhere and easy to unit test.

export interface Bookmark {
  url: string;
  slug: string;
}

export const STORAGE_KEY = 'mona-bookmarks';
export const SLUG_PREFIX = 'mona-';
export const SEPARATOR = ' :: ';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Normalises user input to an absolute http(s) URL, or returns null if invalid. */
export function normalizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return null;
    const href = parsed.href;
    return parsed.pathname === '/' && !parsed.search && !parsed.hash ? href.replace(/\/$/, '') : href;
  } catch {
    return null;
  }
}

function pick(random: () => number): string {
  return BASE62[Math.floor(random() * BASE62.length) % BASE62.length];
}

/** Generates "mona-" + 4 base62 characters. `random` returns a float in [0, 1). */
export function generateSlug(random: () => number = Math.random): string {
  let id = '';
  for (let i = 0; i < 4; i++) id += pick(random);
  return SLUG_PREFIX + id;
}

/** Generates a slug not already used in `existing`. */
export function uniqueSlug(existing: Bookmark[], random: () => number = Math.random): string {
  const used = new Set(existing.map((b) => b.slug));
  for (let i = 0; i < 100; i++) {
    const slug = generateSlug(random);
    if (!used.has(slug)) return slug;
  }
  return generateSlug(random) + pick(random);
}

/** Validates untrusted parsed data, keeping only well-formed {url, slug} entries. */
export function sanitizeBookmarks(value: unknown): Bookmark[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: Bookmark[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const { url, slug } = item as Record<string, unknown>;
    if (typeof url !== 'string' || typeof slug !== 'string') continue;
    const normalized = normalizeUrl(url);
    if (!normalized || !/^mona-[0-9a-zA-Z]+$/.test(slug) || seen.has(slug)) continue;
    seen.add(slug);
    result.push({ url: normalized, slug });
  }
  return result;
}

/** Parses the raw stored string; never throws. */
export function parseStoredBookmarks(raw: string | null | undefined): Bookmark[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    return sanitizeBookmarks(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url}${SEPARATOR}${bookmark.slug}`;
}
