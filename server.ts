import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  clickCount: number;
}

interface Collection {
  id: string; // Slug
  title: string;
  description: string;
  theme?: string;
  links: LinkItem[];
  createdAt: string;
  views: number;
  isPasswordProtected: boolean;
  password?: string;
  expiryTime: "none" | "1h" | "1d" | "7d";
  expiresAt: string | null;
  isPublic: boolean;
  enableQr: boolean;
  enableAnalytics: boolean;
  authorName?: string;
}

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

// Parse JSON payloads
app.use(express.json());

// Helper: Ensure DB file exists
function readDb(): Collection[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data) as Collection[];
  } catch (error) {
    console.error("Error reading database file, resetting:", error);
    return [];
  }
}

// Helper: Save DB file
function writeDb(data: Collection[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Clean up expired links periodically or on-demand
function cleanExpiredCollections(collections: Collection[]): Collection[] {
  const now = new Date();
  let changed = false;
  const filtered = collections.filter(col => {
    if (col.expiresAt) {
      if (new Date(col.expiresAt) < now) {
        changed = true;
        return false;
      }
    }
    return true;
  });
  if (changed) {
    writeDb(filtered);
  }
  return filtered;
}

// Global API Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CREATE a collection
app.post("/api/collections", (req, res) => {
  try {
    const {
      title,
      description,
      links,
      isPasswordProtected,
      password,
      customSlug,
      expiryTime,
      isPublic,
      enableQr,
      enableAnalytics,
      authorName
    } = req.body;

    if (!title || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ error: "Title and at least one link are required." });
    }

    const collections = readDb();
    const cleanCollections = cleanExpiredCollections(collections);

    // Validate custom slug
    let slug = customSlug ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "") : "";
    if (slug) {
      const exists = cleanCollections.find(c => c.id === slug);
      if (exists) {
        return res.status(400).json({ error: "Slug is already taken. Try another custom slug or leave empty for auto-generation." });
      }
    } else {
      // Generate a nice random string slug
      let attempts = 0;
      do {
        slug = Math.random().toString(36).substring(2, 8);
        attempts++;
      } while (cleanCollections.some(c => c.id === slug) && attempts < 10);
    }

    // Expiry calculation
    let expiresAt: string | null = null;
    const now = new Date();
    if (expiryTime === "1h") {
      expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    } else if (expiryTime === "1d") {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (expiryTime === "7d") {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Formulate formatted links arrays
    const formattedLinks: LinkItem[] = links.map((lnk: any, idx: number) => ({
      id: lnk.id || `link_${idx}_${Date.now()}`,
      title: lnk.title || "Untitled Link",
      url: lnk.url.startsWith("http") ? lnk.url : `https://${lnk.url}`,
      clickCount: 0
    }));

    const newCollection: Collection = {
      id: slug,
      title: title.trim(),
      description: (description || "").trim(),
      links: formattedLinks,
      createdAt: new Date().toISOString(),
      views: 0,
      isPasswordProtected: !!isPasswordProtected,
      password: isPasswordProtected ? password || "" : undefined,
      expiryTime: expiryTime || "none",
      expiresAt,
      isPublic: !!isPublic,
      enableQr: !!enableQr,
      enableAnalytics: !!enableAnalytics,
      authorName: (authorName || "").trim() || "Cinemood Creator"
    };

    cleanCollections.push(newCollection);
    writeDb(cleanCollections);

    return res.status(201).json({
      success: true,
      message: "Collection created successfully",
      collection: {
        id: newCollection.id,
        title: newCollection.title,
        expiresAt: newCollection.expiresAt
      }
    });
  } catch (error) {
    console.error("Create collection failed:", error);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
});

// GET a collection by slug/id (includes view-count incrementation)
app.get("/api/collections/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const collections = readDb();
    const cleanCollections = cleanExpiredCollections(collections);

    const col = cleanCollections.find(c => c.id === slug.toLowerCase());
    if (!col) {
      return res.status(404).json({ error: "Cinemood Collection not found or has expired." });
    }

    // Check expiration dynamically just in case
    if (col.expiresAt && new Date(col.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Collection has expired." });
    }

    // If password-protected, check if clients asked for password inside headers/query or if we should guard
    const clientPassword = req.headers["x-cinemood-password"] as string;

    if (col.isPasswordProtected) {
      if (!clientPassword || clientPassword !== col.password) {
        // Return public metadata ONLY, exclude links!
        return res.json({
          id: col.id,
          title: col.title,
          description: col.description,
          authorName: col.authorName,
          createdAt: col.createdAt,
          views: col.views,
          isPasswordProtected: true,
          expiryTime: col.expiryTime,
          enableQr: col.enableQr,
          enableAnalytics: col.enableAnalytics
        });
      }
    }

    // Normal access or successfully unlocked
    col.views += 1;
    writeDb(cleanCollections);

    // Return full details (without full server password secret)
    const { password, ...safeCollection } = col;
    return res.json(safeCollection);
  } catch (error) {
    console.error("Fetch collection failed:", error);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
});

// VERIFY a password explicitly for unlock flow
app.post("/api/collections/:slug/verify-password", (req, res) => {
  const { slug } = req.params;
  const { password } = req.body;

  const collections = readDb();
  const cleanCollections = cleanExpiredCollections(collections);

  const col = cleanCollections.find(c => c.id === slug.toLowerCase());
  if (!col) {
    return res.status(404).json({ error: "Collection not found" });
  }

  if (col.password === password) {
    col.views += 1;
    writeDb(cleanCollections);
    const { password: _, ...safeCol } = col;
    return res.json({ success: true, collection: safeCol });
  } else {
    return res.status(401).json({ error: "Incorrect password. Access denied." });
  }
});

// TRACK link clicks
app.post("/api/collections/:slug/links/:linkId/click", (req, res) => {
  try {
    const { slug, linkId } = req.params;
    const collections = readDb();
    const cleanCollections = cleanExpiredCollections(collections);

    const col = cleanCollections.find(c => c.id === slug.toLowerCase());
    if (!col) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const item = col.links.find(l => l.id === linkId);
    if (item) {
      item.clickCount = (item.clickCount || 0) + 1;
      writeDb(cleanCollections);
      return res.json({ success: true, clickCount: item.clickCount });
    }

    return res.status(404).json({ error: "Link not found inside collection" });
  } catch (error) {
    console.error("Increment link click failed:", error);
    return res.status(500).json({ error: "Failed to increment clicks" });
  }
});

// GET TRENDING / POPULAR COllections
app.get("/api/trending", (req, res) => {
  try {
    const collections = readDb();
    const cleanCollections = cleanExpiredCollections(collections);

    // Find non-password, public, sorted by views descending, take top 6
    const trending = cleanCollections
      .filter(c => c.isPublic && !c.isPasswordProtected)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
      .map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        views: c.views,
        linksCount: c.links.length,
        createdAt: c.createdAt,
        authorName: c.authorName
      }));

    res.json(trending);
  } catch (error) {
    console.error("Trending fetch error:", error);
    res.json([]);
  }
});

// DELETE collection by slug
app.delete("/api/collections/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const collections = readDb();
    const cleanCollections = cleanExpiredCollections(collections);

    const index = cleanCollections.findIndex(c => c.id === slug.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ error: "Collection not found" });
    }

    cleanCollections.splice(index, 1);
    writeDb(cleanCollections);
    return res.json({ success: true, message: "Cinemood Collection deleted successfully." });
  } catch (error) {
    console.error("Delete collection failed:", error);
    return res.status(500).json({ error: "Could not delete collection on server." });
  }
});

// Serves client assets statically or via Vite
async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Inject Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback for all client paths
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cinemood URLs fullstack server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error("Server boot error:", err);
});
