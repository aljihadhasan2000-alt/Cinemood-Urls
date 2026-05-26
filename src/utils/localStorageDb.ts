import { Collection } from "../types";

const KEY = "cinemood_collections";

// Helper to convert title to slug as requested
export function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_]+/g, "-")  // Spaces and underscores to hyphens
    .replace(/-+/g, "-");     // Remove duplicate consecutive hyphens
}

// Default seeded collections for "Exploring Trending"
const DEFAULT_SEEDED_COLLECTIONS: Record<string, Collection> = {
  "sci-fi": {
    id: "sci-fi",
    title: "Sci-Fi Links",
    description: "Premium list of science-fiction trailers, databases, and reviews curated for film geeks.",
    links: [
      { id: "1", title: "Interstellar Official Review", url: "https://www.imdb.com/title/tt0816692/", clickCount: 15 },
      { id: "2", title: "Blade Runner 2049 Trailer", url: "https://www.youtube.com/watch?v=gCcx85zbxz4", clickCount: 9 },
      { id: "3", title: "Dune Part Two Soundtrack", url: "https://open.spotify.com/album/43mB097msc0u1VWeVd8m7G", clickCount: 11 }
    ],
    createdAt: new Date().toISOString(),
    views: 142,
    isPasswordProtected: false,
    expiryTime: "none",
    expiresAt: null,
    isPublic: true,
    enableQr: true,
    enableAnalytics: true,
    authorName: "Cinemood Creator"
  },
  "classic-cinema": {
    id: "classic-cinema",
    title: "Classic Cinema",
    description: "Iconic cinematic masterpieces every cinematography student and film lover needs to explore.",
    links: [
      { id: "1", title: "Citizen Kane Commentary", url: "https://www.imdb.com/title/tt0033467/", clickCount: 22 },
      { id: "2", title: "The Godfather Restoration Inside", url: "https://www.youtube.com/watch?v=UaVTIH8MujA", clickCount: 31 }
    ],
    createdAt: new Date().toISOString(),
    views: 89,
    isPasswordProtected: false,
    expiryTime: "none",
    expiresAt: null,
    isPublic: true,
    enableQr: true,
    enableAnalytics: true,
    authorName: "Classic Curator"
  }
};

// Internal load helper
function loadAllRaw(): Record<string, Collection> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // Seed with initial high-engagement classics
      window.localStorage.setItem(KEY, JSON.stringify(DEFAULT_SEEDED_COLLECTIONS));
      return DEFAULT_SEEDED_COLLECTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read from localStorage:", e);
    return DEFAULT_SEEDED_COLLECTIONS;
  }
}

// Internal save helper
function saveAllRaw(data: Record<string, Collection>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to write to localStorage:", e);
  }
}

// Public interface
export const localStorageDb = {
  getAll(): Collection[] {
    const dict = loadAllRaw();
    return Object.values(dict);
  },

  get(slug: string): Collection | null {
    const canonicalSlug = slug.toLowerCase().trim();
    const dict = loadAllRaw();
    return dict[canonicalSlug] || null;
  },

  save(col: Collection): void {
    const canonicalSlug = col.id.toLowerCase().trim();
    col.id = canonicalSlug;
    const dict = loadAllRaw();
    dict[canonicalSlug] = col;
    saveAllRaw(dict);
  },

  delete(slug: string): boolean {
    const canonicalSlug = slug.toLowerCase().trim();
    const dict = loadAllRaw();
    if (dict[canonicalSlug]) {
      delete dict[canonicalSlug];
      saveAllRaw(dict);
      return true;
    }
    return false;
  },

  incrementViews(slug: string): void {
    const canonicalSlug = slug.toLowerCase().trim();
    const dict = loadAllRaw();
    if (dict[canonicalSlug]) {
      dict[canonicalSlug].views = (dict[canonicalSlug].views || 0) + 1;
      saveAllRaw(dict);
    }
  },

  incrementClickCount(slug: string, linkId: string): void {
    const canonicalSlug = slug.toLowerCase().trim();
    const dict = loadAllRaw();
    const col = dict[canonicalSlug];
    if (col && col.links) {
      col.links = col.links.map(lnk => {
        if (lnk.id === linkId) {
          return { ...lnk, clickCount: (lnk.clickCount || 0) + 1 };
        }
        return lnk;
      });
      saveAllRaw(dict);
    }
  }
};
