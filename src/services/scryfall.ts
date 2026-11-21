const STORAGE_CACHE_KEY = 'mtg_horde_scryfall_cache_v1';
const memoryCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();

function loadCacheFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    Object.entries(parsed).forEach(([k, v]) => memoryCache.set(k, v));
  } catch {}
}

function saveCacheToStorage() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, string> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    window.localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

let cacheInitialized = false;

export async function fetchScryfallCardImage(
  query: string,
  fallbackName?: string
): Promise<string | null> {
  if (!cacheInitialized) {
    loadCacheFromStorage();
    cacheInitialized = true;
  }

  const cacheKey = query.trim().toLowerCase();
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const requestPromise = (async () => {
    try {
      const isSearchSyntax = query.includes(':') || query.startsWith('!');
      const url = isSearchSyntax
        ? `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`
        : `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      if (!res.ok) {
        if (fallbackName && fallbackName !== query) {
          return fetchScryfallCardImage(fallbackName);
        }
        return null;
      }

      const data = await res.json();
      const card = isSearchSyntax ? data?.data?.[0] : data;

      const imageUrl: string | undefined =
        card?.image_uris?.normal ??
        card?.card_faces?.[0]?.image_uris?.normal ??
        card?.image_uris?.large;

      if (imageUrl) {
        memoryCache.set(cacheKey, imageUrl);
        saveCacheToStorage();
        return imageUrl;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}
