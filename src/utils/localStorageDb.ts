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

// Lightweight Promise-based IndexedDB Engine for local offline mirroring
const idb = {
  db: null as IDBDatabase | null,
  
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      // Support browsers without IndexedDB safely
      if (typeof indexedDB === "undefined") {
        return reject(new Error("IndexedDB is not supported on this platform."));
      }
      
      const request = indexedDB.open("CinemoodDB", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "id" });
        }
      };
    });
  },

  async get(key: string): Promise<any> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("collections", "readonly");
        const store = tx.objectStore("collections");
        const request = store.get(key.toLowerCase().trim());
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (e) {
      // Graceful fallback to localStorage
      try {
        const stored = localStorage.getItem(`cinemood-${key.toLowerCase().trim()}`);
        return stored ? JSON.parse(stored) : null;
      } catch (err) {
        return null;
      }
    }
  },

  async put(val: any): Promise<void> {
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("collections", "readwrite");
        const store = tx.objectStore("collections");
        const request = store.put(val);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (e) {
      // Graceful localStorage sync
      try {
        localStorage.setItem(`cinemood-${val.id}`, JSON.stringify(val));
      } catch (err) {
        console.error("Local caching exhausted:", err);
      }
    }
  },

  async delete(key: string): Promise<void> {
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("collections", "readwrite");
        const store = tx.objectStore("collections");
        const request = store.delete(key.toLowerCase().trim());
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (e) {
      try {
        localStorage.removeItem(`cinemood-${key.toLowerCase().trim()}`);
      } catch (err) {}
    }
  },

  async getAll(): Promise<any[]> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("collections", "readonly");
        const store = tx.objectStore("collections");
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch (e) {
      // Search localStorage index keys
      const list: any[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("cinemood-")) {
            const item = JSON.parse(localStorage.getItem(key) || "");
            if (item) list.push(item);
          }
        }
      } catch (err) {}
      return list;
    }
  }
};

// Seed default fallback options local caches
const DEFAULT_SEEDS: Record<string, Collection> = {
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

// Initialize default seeds in local sandboxes on script evaluate
async function seedSandboxes() {
  if (typeof window === "undefined") return;
  for (const slug of Object.keys(DEFAULT_SEEDS)) {
    const cached = await idb.get(slug);
    if (!cached) {
      await idb.put(DEFAULT_SEEDS[slug]);
      localStorage.setItem(`cinemood-${slug}`, JSON.stringify(DEFAULT_SEEDS[slug]));
    }
  }
}
seedSandboxes().catch(() => {});

// Advanced Fetch Retry with Exponential Backoff
async function fetchWithRetry(url: string, options?: RequestInit, retries = 3, delay = 500): Promise<Response> {
  try {
    const res = await fetch(url, options);
    // Retry on server-side issues (502, 503, 504) or failed fetches
    if (!res.ok && [502, 503, 504].includes(res.status) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
}

// Cloud API & IndexedDB Hybrid controller
export const localStorageDb = {
  async getLocalOnly(slug: string): Promise<Collection | null> {
    const canonicalSlug = slug.toLowerCase().trim();
    if (!canonicalSlug) return null;
    return await idb.get(canonicalSlug);
  },

  async backgroundSync(): Promise<void> {
    try {
      const createdStr = localStorage.getItem("cinemood-created-slugs");
      if (!createdStr) return;
      const createdList = JSON.parse(createdStr);
      if (!Array.isArray(createdList) || createdList.length === 0) return;

      // Silently restore any local collections missing on MongoDB/JSON-DB
      for (const slug of createdList) {
        if (!slug) continue;
        const cachedCol = await idb.get(slug);
        if (!cachedCol) continue;

        try {
          const checkRes = await fetch(`/api/get/${slug}`);
          if (checkRes.status === 404) {
            // It has gone missing on the server! Back up is silently re-uploaded
            await fetch("/api/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...cachedCol, isSync: true })
            });
          }
        } catch (e) {
          // Offlines or network transient ignores
        }
      }
    } catch (err) {
      // Quiet check
    }
  },

  async getAll(): Promise<Collection[]> {
    // Trigger backup sync check in natural background context
    this.backgroundSync().catch(() => {});

    try {
      // 1. Fetch public sheets from the backend server API with retry support
      const res = await fetchWithRetry("/api/trending");
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.collections)) {
          // Sync with local cache in background
          const fetchedCollections = body.collections as any[];
          for (const item of fetchedCollections) {
            // Lazy load fill fields if missing during listing
            const cached = await idb.get(item.id);
            if (!cached || cached.views !== item.views) {
              const enriched = { 
                ...DEFAULT_SEEDS[item.id], 
                ...cached, 
                ...item,
                links: cached?.links || DEFAULT_SEEDS[item.id]?.links || [] 
              };
              await idb.put(enriched);
            }
          }
          
          // Re-get from IDB to preserve details of links
          const list = await idb.getAll();
          return list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
    } catch (e) {
      // Quiet fallbacks
    }

    // 2. Fallback to client cache (IndexedDB + LocalStorage)
    const list = await idb.getAll();
    if (list.length === 0) {
      return Object.values(DEFAULT_SEEDS);
    }
    return list;
  },

  async get(slug: string): Promise<Collection | null> {
    const canonicalSlug = slug.toLowerCase().trim();
    if (!canonicalSlug) return null;

    try {
      // 1. Query server-side api get handler with retry support
      const res = await fetchWithRetry(`/api/get/${canonicalSlug}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.collection) {
          const colObj = body.collection as Collection;
          // Synchronize/cache to local mirror
          await idb.put(colObj);
          return colObj;
        }
      } else if (res.status === 404 || res.status === 410) {
        // Double check if we own this and need to restore it
        const createdStr = localStorage.getItem("cinemood-created-slugs");
        const createdList = createdStr ? JSON.parse(createdStr) : [];
        if (Array.isArray(createdList) && createdList.includes(canonicalSlug) && res.status === 404) {
          const cachedLocal = await idb.get(canonicalSlug);
          if (cachedLocal) {
            // Re-upload/restore to live container db
            await fetch("/api/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...cachedLocal, isSync: true })
            });
            return cachedLocal;
          }
        }

        // Slug truly does not exist on server or was deleted, mirror deletion locally
        await idb.delete(canonicalSlug);
        return null; // Return null to show real non-existence
      }
    } catch (e) {
      // Offline/timeout fallback
    }

    // 2. Fallback Secure Recovery Module
    const cached = await idb.get(canonicalSlug);
    if (cached) {
      return cached;
    }

    // Secondary Default fallback
    if (DEFAULT_SEEDS[canonicalSlug]) {
      return DEFAULT_SEEDS[canonicalSlug];
    }

    return null;
  },

  async save(col: Collection): Promise<void> {
    const canonicalSlug = col.id.toLowerCase().trim();
    col.id = canonicalSlug;

    // Register that this client created this collection
    try {
      const createdStr = localStorage.getItem("cinemood-created-slugs");
      const createdList = createdStr ? JSON.parse(createdStr) : [];
      if (Array.isArray(createdList) && !createdList.includes(canonicalSlug)) {
        createdList.push(canonicalSlug);
        localStorage.setItem("cinemood-created-slugs", JSON.stringify(createdList));
      }
    } catch (err) {}

    // 1. Immediately cache locally for instant frontend UX
    await idb.put(col);
    try {
      localStorage.setItem(`cinemood-${canonicalSlug}`, JSON.stringify(col));
    } catch (err) {}

    // 2. Mirror securely in server-side DB with retry support
    try {
      const res = await fetchWithRetry("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(col)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.collection) {
          // Re-update the saved collection from server (handles server generated fields/unique id)
          await idb.put(data.collection);
        }
      }
    } catch (e) {
      // Preserved cleanly
    }
  },

  async delete(slug: string): Promise<boolean> {
    const canonicalSlug = slug.toLowerCase().trim();
    if (!canonicalSlug) return false;

    // Remove from our creation lists
    try {
      const createdStr = localStorage.getItem("cinemood-created-slugs");
      if (createdStr) {
        const createdList = JSON.parse(createdStr);
        if (Array.isArray(createdList)) {
          const filtered = createdList.filter(s => s !== canonicalSlug);
          localStorage.setItem("cinemood-created-slugs", JSON.stringify(filtered));
        }
      }
    } catch (e) {}

    // 1. Clear local cache
    await idb.delete(canonicalSlug);
    try {
      localStorage.removeItem(`cinemood-${canonicalSlug}`);
    } catch (err) {}

    // 2. Instruct backend server to delete with retry support
    try {
      const res = await fetchWithRetry(`/api/delete/${canonicalSlug}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const body = await res.json();
        return !!body.success;
      }
    } catch (e) {
      // Deferred
    }
    return true;
  },

  async incrementViews(slug: string): Promise<void> {
    const canonicalSlug = slug.toLowerCase().trim();
    if (!canonicalSlug) return;

    // 1. Increment local cache
    const col = await idb.get(canonicalSlug);
    if (col) {
      col.views = (col.views || 0) + 1;
      await idb.put(col);
    }

    // 2. Mirror views back-end trigger securely
    try {
      fetch(`/api/get/${canonicalSlug}`).catch(() => {});
    } catch (e) {}
  },

  async incrementClickCount(slug: string, linkId: string): Promise<void> {
    const canonicalSlug = slug.toLowerCase().trim();
    if (!canonicalSlug) return;

    // 1. Increment click count locally
    const col = await idb.get(canonicalSlug);
    if (col && col.links) {
      col.links = col.links.map((lnk: any) => {
        if (lnk.id === linkId) {
          return { ...lnk, clickCount: (lnk.clickCount || 0) + 1 };
        }
        return lnk;
      });
      await idb.put(col);
    }

    // 2. Dispatch click count trigger to server API
    try {
      fetch(`/api/collections/${canonicalSlug}/links/${linkId}/click`, {
        method: "POST"
      }).catch(() => {
        fetch(`/api/collections/${canonicalSlug}/links/${linkId}/click`);
      });
    } catch (err) {}
  },

  // Auto Repair & Slug Sanitization Verification Helper
  async repairSlugReferences(): Promise<{ repaired: number }> {
    let repairedCount = 0;
    try {
      const all = await idb.getAll();
      for (const col of all) {
        const cleanId = convertTitleToSlug(col.id);
        if (cleanId !== col.id) {
          await idb.delete(col.id);
          col.id = cleanId;
          await idb.put(col);
          repairedCount++;
        }
      }
    } catch (e) {
      // Quiet fail
    }
    return { repaired: repairedCount };
  }
};
