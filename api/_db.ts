import mongoose from "mongoose";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  clickCount: number;
}

export interface Collection {
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

// Connection caching interface
interface MongooseCache {
  conn: any;
  promise: any;
}

let cached: MongooseCache = (global as any).mongooseCache;
if (!cached) {
  cached = (global as any).mongooseCache = { conn: null, promise: null };
}

// Reliable high-performance in-memory fallback store
let inMemoryStore: Map<string, Collection> = (global as any).cinemoodInMemoryStore;
if (!inMemoryStore) {
  inMemoryStore = (global as any).cinemoodInMemoryStore = new Map<string, Collection>();
  
  // Seed with standard cinematic classics to ensure high-engagement views
  const sample1: Collection = {
    id: "sci-fi",
    title: "Must-Watch Sci-Fi Links",
    description: "Premium list of science-fiction trailers, databases, and reviews curated for film geeks.",
    theme: "purple",
    links: [
      { id: "1", title: "Interstellar Official Review", url: "https://www.imdb.com/title/tt0816692/", clickCount: 15 },
      { id: "2", title: "Blade Runner 2049 Trailer", url: "https://www.youtube.com/watch?v=gCcx85zbxz4", clickCount: 9 },
      { id: "3", title: "Dune Part Two Soundtrack", url: "https://open.spotify.com/album/43mB097msc0u1VWeVd8m7G", clickCount: 11 }
    ],
    createdAt: new Date().toISOString(),
    views: 42,
    isPasswordProtected: false,
    expiryTime: "none",
    expiresAt: null,
    isPublic: true,
    enableQr: true,
    enableAnalytics: true,
    authorName: "Cinemood Creator"
  };
  inMemoryStore.set(sample1.id, sample1);
}

const collectionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
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

export async function connectToMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGODB_URI or MONGO_URI is not defined in environment. Fallback store is active.");
    return false;
  }

  // Already connected or connecting?
  if (mongoose.connection.readyState >= 1 && cached.conn) {
    return true;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    }).then((m) => {
      cached.conn = m;
      return m;
    }).catch((err) => {
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }

  try {
    // Race connection against a 4.2-second timeout to safeguard against Vercel cold execution stalls or Atlas firewall hangs
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database connection attempt timed out")), 4200)
    );

    await Promise.race([cached.promise, timeoutPromise]);
    return true;
  } catch (err) {
    cached.promise = null; // Clear promise to allow retries on subsequent requests
    cached.conn = null;
    console.error("MongoDB failed to connect dynamically. Local in-memory storage fallback will handle request.", err);
    return false;
  }
}

export async function fetchAllCollections(): Promise<Collection[]> {
  const connected = await connectToMongo().catch(() => false);
  if (!connected) {
    console.warn("MongoDB offline or unconfigured. Gathering collections from in-memory backup.");
    const arr = Array.from(inMemoryStore.values());
    const now = new Date();
    const valid: Collection[] = [];
    for (const col of arr) {
      if (col.expiresAt && new Date(col.expiresAt) < now) {
        inMemoryStore.delete(col.id);
      } else {
        valid.push(col);
      }
    }
    return valid;
  }

  try {
    const documents = await MongoCollection.find({}).lean();
    const collections = documents as unknown as Collection[];
    const now = new Date();
    const valid: Collection[] = [];

    for (const col of collections) {
      if (col.expiresAt && new Date(col.expiresAt) < now) {
        MongoCollection.deleteOne({ id: col.id }).catch((e: any) => {
          console.error("Failed to delete expired collection from Database:", e);
        });
      } else {
        valid.push(col);
      }
    }
    return valid;
  } catch (err: any) {
    console.error("fetchAll collections from Mongo failed, falling back to in-memory store:", err);
    return Array.from(inMemoryStore.values());
  }
}

export async function fetchOneCollection(slug: string): Promise<Collection | null> {
  const canonicalSlug = slug.toLowerCase().trim();
  const connected = await connectToMongo().catch(() => false);
  if (!connected) {
    console.warn(`MongoDB offline. Fetching "${canonicalSlug}" from in-memory fallback.`);
    const col = inMemoryStore.get(canonicalSlug);
    if (col) {
      if (col.expiresAt && new Date(col.expiresAt) < new Date()) {
        inMemoryStore.delete(canonicalSlug);
        return null;
      }
      return col;
    }
    return null;
  }

  try {
    const doc = await MongoCollection.findOne({ id: canonicalSlug }).lean();
    if (doc) {
      const col = doc as unknown as Collection;
      if (col.expiresAt && new Date(col.expiresAt) < new Date()) {
        await MongoCollection.deleteOne({ id: canonicalSlug }).catch(() => {});
        return null;
      }
      return col;
    }
    // Also check inMemoryStore in case it was created or saved in memory
    const localCol = inMemoryStore.get(canonicalSlug);
    if (localCol) {
      return localCol;
    }
    return null;
  } catch (err: any) {
    console.error(`fetchOne collection "${slug}" from Mongo failed, falling back to in-memory:`, err);
    const col = inMemoryStore.get(canonicalSlug);
    if (col) {
      if (col.expiresAt && new Date(col.expiresAt) < new Date()) {
        inMemoryStore.delete(canonicalSlug);
        return null;
      }
      return col;
    }
    return null;
  }
}

export async function saveOneCollection(col: Collection): Promise<void> {
  const canonicalSlug = col.id.toLowerCase().trim();
  col.id = canonicalSlug;
  // Always update in-memory cache so we remain consistent and ultra-fast
  inMemoryStore.set(canonicalSlug, col);

  const connected = await connectToMongo().catch(() => false);
  if (!connected) {
    console.warn(`MongoDB offline. Saved collection "${canonicalSlug}" to resilient in-memory storage fallback.`);
    return;
  }

  try {
    await MongoCollection.findOneAndUpdate(
      { id: col.id },
      col,
      { upsert: true, new: true, runValidators: true }
    );
  } catch (err: any) {
    console.error("saveOne collection to MongoDB failed. Backed up in-memory:", err);
  }
}

export async function deleteOneCollection(slug: string): Promise<boolean> {
  const canonicalSlug = slug.toLowerCase().trim();
  const deletedFromLocal = inMemoryStore.delete(canonicalSlug);

  const connected = await connectToMongo().catch(() => false);
  if (!connected) {
    console.warn(`MongoDB offline. Deleted collection "${canonicalSlug}" from in-memory fallback.`);
    return deletedFromLocal;
  }

  try {
    const result = await MongoCollection.deleteOne({ id: canonicalSlug });
    return result.deletedCount > 0 || deletedFromLocal;
  } catch (err: any) {
    console.error("deleteOne collection from Mongo failed:", err);
    return deletedFromLocal;
  }
}
