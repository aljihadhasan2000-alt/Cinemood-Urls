import mongoose from "mongoose";
import path from "path";
import fs from "fs";

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

const DB_FILE = process.env.VERCEL
  ? path.join("/tmp", "database.json")
  : path.join(process.cwd(), "database.json");

// Connect cache
interface MongooseCache {
  conn: any;
  promise: any;
}

let cached: MongooseCache = (global as any).mongooseCache;
if (!cached) {
  cached = (global as any).mongooseCache = { conn: null, promise: null };
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

let mongooseConnected = false;

export async function connectToMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    mongooseConnected = false;
    return false;
  }
  
  if (mongoose.connection.readyState >= 1) {
    mongooseConnected = true;
    return true;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
    mongooseConnected = true;
    return true;
  } catch (err) {
    cached.promise = null; // Clear to allow retries on subsequent requests
    console.error("MongoDB connection active failure:", err);
    mongooseConnected = false;
    return false;
  }
}

export function readDb(): Collection[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data) as Collection[];
  } catch (error) {
    return [];
  }
}

export function writeDb(data: Collection[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("JSON persistence error:", error);
  }
}

export function cleanExpiredCollections(collections: Collection[]): Collection[] {
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

export async function fetchAllCollections(): Promise<Collection[]> {
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      const documents = await MongoCollection.find({}).lean();
      const collections = documents as unknown as Collection[];
      const now = new Date();
      const valid: Collection[] = [];
      for (const col of collections) {
        if (col.expiresAt && new Date(col.expiresAt) < now) {
          MongoCollection.deleteOne({ id: col.id }).catch((e: any) => {
            console.error("Failed to delete expired Mongo collection:", e);
          });
        } else {
          valid.push(col);
        }
      }
      return valid;
    } catch (err) {
      console.error("Mongoose fetchAll collections failed:", err);
    }
  }
  return cleanExpiredCollections(readDb());
}

export async function fetchOneCollection(slug: string): Promise<Collection | null> {
  const canonicalSlug = slug.toLowerCase().trim();
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      const doc = await MongoCollection.findOne({ id: canonicalSlug }).lean();
      if (doc) {
        const col = doc as unknown as Collection;
        if (col.expiresAt && new Date(col.expiresAt) < new Date()) {
          await MongoCollection.deleteOne({ id: canonicalSlug });
          return null;
        }
        return col;
      }
      return null;
    } catch (err) {
      console.error("Mongoose fetchOne collection failed:", err);
    }
  }

  const collections = cleanExpiredCollections(readDb());
  const match = collections.find(c => c.id === canonicalSlug);
  return match || null;
}

export async function saveOneCollection(col: Collection): Promise<void> {
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      await MongoCollection.findOneAndUpdate({ id: col.id }, col, { upsert: true, new: true });
      return;
    } catch (err) {
      console.error("Mongoose saveOne collection failed:", err);
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

export async function deleteOneCollection(slug: string): Promise<boolean> {
  const canonicalSlug = slug.toLowerCase().trim();
  const hasMongo = await connectToMongo();
  if (hasMongo && mongooseConnected) {
    try {
      const result = await MongoCollection.deleteOne({ id: canonicalSlug });
      return result.deletedCount > 0;
    } catch (err) {
      console.error("Mongoose deleteOne collection failed:", err);
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
