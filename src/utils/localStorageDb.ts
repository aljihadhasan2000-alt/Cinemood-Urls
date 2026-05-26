import { Collection } from "../types";

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

// Public interface using "cinemood-${slug}" as key
export const localStorageDb = {
  getAll(): Collection[] {
    if (typeof window === "undefined") return [];
    
    const list: Collection[] = [];
    let hasSeeded = false;
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("cinemood-")) {
        hasSeeded = true;
        try {
          const item = JSON.parse(window.localStorage.getItem(key) || "");
          if (item) {
            list.push(item);
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }
    
    if (!hasSeeded) {
      // Seed with default options
      Object.keys(DEFAULT_SEEDED_COLLECTIONS).forEach(slug => {
        const col = DEFAULT_SEEDED_COLLECTIONS[slug];
        window.localStorage.setItem(`cinemood-${slug}`, JSON.stringify(col));
        list.push(col);
      });
    }
    
    return list;
  },

  get(slug: string): Collection | null {
    if (typeof window === "undefined") return null;
    const canonicalSlug = slug.toLowerCase().trim();
    try {
      const stored = window.localStorage.getItem(`cinemood-${canonicalSlug}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
    }
    
    // Seed in case of individual hit if not yet populated
    if (DEFAULT_SEEDED_COLLECTIONS[canonicalSlug]) {
      const col = DEFAULT_SEEDED_COLLECTIONS[canonicalSlug];
      window.localStorage.setItem(`cinemood-${canonicalSlug}`, JSON.stringify(col));
      return col;
    }
    
    return null;
  },

  save(col: Collection): void {
    if (typeof window === "undefined") return;
    const canonicalSlug = col.id.toLowerCase().trim();
    col.id = canonicalSlug;
    window.localStorage.setItem(`cinemood-${canonicalSlug}`, JSON.stringify(col));
  },

  delete(slug: string): boolean {
    if (typeof window === "undefined") return false;
    const canonicalSlug = slug.toLowerCase().trim();
    const key = `cinemood-${canonicalSlug}`;
    if (window.localStorage.getItem(key)) {
      window.localStorage.removeItem(key);
      return true;
    }
    return false;
  },

  incrementViews(slug: string): void {
    if (typeof window === "undefined") return;
    const canonicalSlug = slug.toLowerCase().trim();
    const col = this.get(canonicalSlug);
    if (col) {
      col.views = (col.views || 0) + 1;
      this.save(col);
    }
  },

  incrementClickCount(slug: string, linkId: string): void {
    if (typeof window === "undefined") return;
    const canonicalSlug = slug.toLowerCase().trim();
    const col = this.get(canonicalSlug);
    if (col && col.links) {
      col.links = col.links.map(lnk => {
        if (lnk.id === linkId) {
          return { ...lnk, clickCount: (lnk.clickCount || 0) + 1 };
        }
        return lnk;
      });
      this.save(col);
    }
  }
};
