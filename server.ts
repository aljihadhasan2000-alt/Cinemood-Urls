import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import "dotenv/config";

// Interface definitions
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

// Global API Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- MONGOOSE / MONGODB INTEGRATION ---
let mongooseConnected = false;

// Collection Schema for Mongoose
const collectionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Slug
  title: { type: String, required: true },
  description: { type: String, default: "" },
  theme: { type: String, default: "" },
  links: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    clickCount: { type: Number, default: 0 }
  }],
  createdAt: { type: String, required: true },
  views: { type: Number, default: 0 },
  isPasswordProtected: { type: Boolean, default: false },
  password: { type: String },
  expiryTime: { type: String, default: "none" },
  expiresAt: { type: String, default: null },
  isPublic: { type: Boolean, default: true },
  enableQr: { type: Boolean, default: true },
  enableAnalytics: { type: Boolean, default: false },
  authorName: { type: String, default: "Cinemood Creator" }
});

const MongoCollection = (mongoose.models.CinemoodCollection || mongoose.model("CinemoodCollection", collectionSchema)) as any;

// Lazy initialization database connection
async function connectToMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    mongooseConnected = false;
    return false;
  }
  
  if (mongooseConnected && mongoose.connection.readyState >= 1) {
    return true;
  }

  try {
    await mongoose.connect(uri, {
      bufferCommands: false, // Prevents hanging operations if connection is dead/unstable
    });
    mongooseConnected = true;
    console.log("Connected successfully to MongoDB.");
    return true;
  } catch (err) {
    console.error("MongoDB connection failed. Falling back to JSON database file:", err);
    mongooseConnected = false;
    return false;
  }
}

// --- FILE SYSTEM DATABASE FALLBACK HELPERS ---
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

function writeDb(data: Collection[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Filter and cleanup expired links
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

// --- DB ADAPTER OPERATIONS (UNIFY MONGO AND LOCAL JSON FILE) ---
async function fetchAllCollections(): Promise<Collection[]> {
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      const documents = await MongoCollection.find({}).lean();
      return documents as unknown as Collection[];
    } catch (err) {
      console.error("Mongo fetch failed, falling back to Local JSON reads:", err);
    }
  }
  return cleanExpiredCollections(readDb());
}

async function fetchOneCollection(slug: string): Promise<Collection | null> {
  const canonicalSlug = slug.toLowerCase().trim();
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      const doc = await MongoCollection.findOne({ id: canonicalSlug }).lean();
      if (doc) {
        const col = doc as unknown as Collection;
        // Check dynamic expiry
        if (col.expiresAt && new Date(col.expiresAt) < new Date()) {
          // Dynamic deletion of expired on MongoDB
          await MongoCollection.deleteOne({ id: canonicalSlug });
          return null;
        }
        return col;
      }
      return null;
    } catch (err) {
      console.error("Mongo fetchOne failed, reading from Local JSON instead:", err);
    }
  }

  const collections = cleanExpiredCollections(readDb());
  const match = collections.find(c => c.id === canonicalSlug);
  return match || null;
}

async function saveOneCollection(col: Collection): Promise<void> {
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      await MongoCollection.findOneAndUpdate({ id: col.id }, col, { upsert: true, new: true });
      return;
    } catch (err) {
      console.error("Mongo saveOne failed, writing to Local JSON instead:", err);
    }
  }

  const collections = readDb();
  const index = collections.findIndex(c => c.id === col.id);
  if (index !== -1) {
    collections[index] = col;
  } else {
    collections.push(col);
  }
  writeDb(collections);
}

async function deleteOneCollection(slug: string): Promise<boolean> {
  const canonicalSlug = slug.toLowerCase().trim();
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      const result = await MongoCollection.deleteOne({ id: canonicalSlug });
      return result.deletedCount > 0;
    } catch (err) {
      console.error("Mongo delete failed, targeting Local JSON instead:", err);
    }
  }

  const collections = readDb();
  const index = collections.findIndex(c => c.id === canonicalSlug);
  if (index !== -1) {
    collections.splice(index, 1);
    writeDb(collections);
    return true;
  }
  return false;
}

// --- EXPRESS API ROUTE HANDLERS ---

// CREATE a collection
app.post("/api/collections", async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, error: "Missing payload body." });
    }

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

    // Strict validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, error: "Collection Title is required." });
    }

    if (!links || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ success: false, error: "At least one link node is required." });
    }

    const collections = await fetchAllCollections();

    // Validate and process custom slug
    let slug = customSlug ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "") : "";
    if (slug) {
      const exists = collections.find(c => c.id === slug);
      if (exists) {
        return res.status(400).json({ success: false, error: "Slug is already taken. Try another custom slug or leave empty." });
      }
    } else {
      let attempts = 0;
      do {
        slug = Math.random().toString(36).substring(2, 8);
        attempts++;
      } while (collections.some(c => c.id === slug) && attempts < 15);
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

    // Format secure links
    const formattedLinks: LinkItem[] = links.map((lnk: any, idx: number) => ({
      id: lnk.id || `link_${idx}_${Date.now()}`,
      title: (lnk.title || "Visit Link").trim(),
      url: lnk.url.startsWith("http") ? lnk.url.trim() : `https://${lnk.url.trim()}`,
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

    await saveOneCollection(newCollection);

    // Compute direct dynamic shareable link URL
    const host = req.headers.host || "cinemood-urls.vercel.app";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const generatedUrl = `${cleanBaseUrl}/p/${slug}`;

    return res.status(201).json({
      success: true,
      slug: slug,
      url: generatedUrl,
      collection: {
        id: newCollection.id,
        title: newCollection.title,
        expiresAt: newCollection.expiresAt
      }
    });

  } catch (error) {
    next(error);
  }
});

// GET a collection by slug
app.get("/api/collections/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const col = await fetchOneCollection(slug);

    if (!col) {
      return res.status(404).json({ success: false, error: "Cinemood URLs collection not found or has expired." });
    }

    const clientPassword = req.headers["x-cinemood-password"] as string;

    if (col.isPasswordProtected) {
      if (!clientPassword || clientPassword !== col.password) {
        // Obfuscated payload: return ONLY public fields
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

    // Add view count dynamically
    col.views += 1;
    await saveOneCollection(col);

    // Safe extraction: strip actual raw secret passcode
    const { password, ...safeCollection } = col;
    return res.json(safeCollection);

  } catch (error) {
    next(error);
  }
});

// VERIFY explicit passcode
app.post("/api/collections/:slug/verify-password", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    const col = await fetchOneCollection(slug);
    if (!col) {
      return res.status(404).json({ success: false, error: "Collection not found" });
    }

    if (col.password === password) {
      col.views += 1;
      await saveOneCollection(col);

      const { password: _, ...safeCol } = col;
      return res.json({ success: true, collection: safeCol });
    } else {
      return res.status(401).json({ success: false, error: "Incorrect password. Access denied." });
    }

  } catch (error) {
    next(error);
  }
});

// INCREASE link click counts
app.post("/api/collections/:slug/links/:linkId/click", async (req, res, next) => {
  try {
    const { slug, linkId } = req.params;
    const col = await fetchOneCollection(slug);

    if (!col) {
      return res.status(404).json({ success: false, error: "Collection not found" });
    }

    const item = col.links.find(l => l.id === linkId);
    if (item) {
      item.clickCount = (item.clickCount || 0) + 1;
      await saveOneCollection(col);
      return res.json({ success: true, clickCount: item.clickCount });
    }

    return res.status(404).json({ success: false, error: "Link identifier not found." });

  } catch (error) {
    next(error);
  }
});

// GET trending/popular collections lists
app.get("/api/trending", async (req, res, next) => {
  try {
    const collections = await fetchAllCollections();

    // Find non-password, public, sorted by views descending, take top 6
    const trending = collections
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

    return res.json(trending);

  } catch (error) {
    next(error);
  }
});

// DELETE collection
app.delete("/api/collections/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const deleted = await deleteOneCollection(slug);

    if (deleted) {
      return res.json({ success: true, message: "Cinemood Collection deleted successfully." });
    } else {
      return res.status(404).json({ success: false, error: "Collection not found" });
    }

  } catch (error) {
    next(error);
  }
});

// --- ROUTING ERROR FALLBACK PROTECTION ---

// Unmatched API requests: respond with clear JSON and NOT index.html fallback
app.all("/api/*", (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.url}' does not exist.`
  });
});

// Global API Errors Middleware catcher: enforces JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.url.startsWith("/api/")) {
    console.error("Unhandled API Server Error:", err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || "An unhandled server error occurred."
    });
  }
  next(err);
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
