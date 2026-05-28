import mongoose from "mongoose";
import fs from "fs";
import path from "path";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  clickCount?: number;
}

export interface Collection {
  id: string; // The sanitized lowercase slug (used as directory key)
  title: string;
  description: string;
  links: LinkItem[];
  createdAt: string;
  views: number;
  isPasswordProtected: boolean;
  expiryTime: "none" | "1h" | "1d" | "7d";
  expiresAt: string | null;
  isPublic: boolean;
  enableQr: boolean;
  enableAnalytics: boolean;
  authorName?: string;
  password?: string;
}

const linkItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  clickCount: { type: Number, default: 0 }
}, { bufferCommands: false });

const collectionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  links: [linkItemSchema],
  createdAt: { type: String, required: true },
  views: { type: Number, default: 0 },
  isPasswordProtected: { type: Boolean, default: false },
  expiryTime: { type: String, default: "none" },
  expiresAt: { type: String, default: null },
  isPublic: { type: Boolean, default: true },
  enableQr: { type: Boolean, default: true },
  enableAnalytics: { type: Boolean, default: true },
  authorName: { type: String, default: "Cinemood Creator" },
  password: { type: String, default: "" }
}, {
  timestamps: false,
  bufferCommands: false
});

let CollectionModel: any;
try {
  mongoose.set("bufferCommands", false);
  CollectionModel = mongoose.models.Collection || mongoose.model("Collection", collectionSchema);
} catch (e) {
  // Model creation safe guards
}

// Static default seeds
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

const getFilePath = () => {
  // Using /tmp makes it compatible with Vercel serverless environment permissions, fallback to cwd in Dev
  const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
  return isVercel ? "/tmp/cinemood_database.json" : path.join(process.cwd(), "cinemood_database.json");
};

function readLocalDb(): Record<string, Collection> {
  const filePath = getFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content || "{}");
    } catch (e) {
      console.error("Local file read exception, resetting local store:", e);
    }
  }
  
  // Seed initial data
  try {
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_SEEDED_COLLECTIONS, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write initial seeded data file:", e);
  }
  return DEFAULT_SEEDED_COLLECTIONS;
}

function writeLocalDb(dbObj: Record<string, Collection>) {
  const filePath = getFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(dbObj, null, 2), "utf-8");
  } catch (e) {
    console.error("Local db storage write mismatch error:", e);
  }
}

let isConnected = false;
let lastConnectAttempt = 0;
const RECONNECT_COOL_DOWN_MS = 20000; // 20s cooldown to prevent hanging API requests on offlines

async function connectToMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;
  if (isConnected) return true;

  const now = Date.now();
  if (now - lastConnectAttempt < RECONNECT_COOL_DOWN_MS) {
    return false;
  }

  lastConnectAttempt = now;
  try {
    mongoose.set("bufferCommands", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // 2s quick fail to ensure instant page load
      connectTimeoutMS: 2000,
    } as any);
    isConnected = true;
    console.log("Connected securely to cloud MongoDB index registry.");
    return true;
  } catch (e: any) {
    console.log("MongoDB connection attempt timed out or failed. Running secure local JSON-DB fallback.");
    // Force reset isConnected so next cycle can retry after cooldown expires
    isConnected = false;
    return false;
  }
}

export const dbService = {
  async get(slug: string): Promise<Collection | null> {
    const cleanSlug = slug.toLowerCase().trim();
    const useMongo = await connectToMongo();
    
    if (useMongo && CollectionModel) {
      try {
        const doc = await CollectionModel.findOne({ id: cleanSlug }).lean();
        if (doc) {
          const { _id, __v, ...rest } = doc as any;
          return rest as Collection;
        }
      } catch (err: any) {
        // Silent fallback to avoid trace spamming
      }
    }
    
    // Local fallback/sync
    const local = readLocalDb();
    if (local[cleanSlug]) {
      return local[cleanSlug];
    }
    
    // Seed recovery
    if (DEFAULT_SEEDED_COLLECTIONS[cleanSlug]) {
      return DEFAULT_SEEDED_COLLECTIONS[cleanSlug];
    }
    
    return null;
  },

  async save(col: Collection): Promise<void> {
    const cleanSlug = col.id.toLowerCase().trim();
    col.id = cleanSlug;
    
    const useMongo = await connectToMongo();
    if (useMongo && CollectionModel) {
      try {
        await CollectionModel.findOneAndUpdate(
          { id: cleanSlug },
          col,
          { upsert: true, new: true }
        );
      } catch (err: any) {
        // Silent fallback
      }
    }
    
    const local = readLocalDb();
    local[cleanSlug] = col;
    writeLocalDb(local);
  },

  async delete(slug: string): Promise<boolean> {
    const cleanSlug = slug.toLowerCase().trim();
    const useMongo = await connectToMongo();
    
    let deleted = false;
    if (useMongo && CollectionModel) {
      try {
        const result = await CollectionModel.deleteOne({ id: cleanSlug });
        deleted = (result.deletedCount || 0) > 0;
      } catch (err: any) {
        // Silent fallback
      }
    }
    
    const local = readLocalDb();
    if (local[cleanSlug]) {
      delete local[cleanSlug];
      writeLocalDb(local);
      deleted = true;
    }
    
    return deleted;
  },

  async getAllPublic(): Promise<Collection[]> {
    const useMongo = await connectToMongo();
    if (useMongo && CollectionModel) {
      try {
        const list = await CollectionModel.find({ isPublic: { $ne: false } })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
        if (list && list.length > 0) {
          return list.map((doc: any) => {
            const { _id, __v, ...rest } = doc;
            return rest as Collection;
          });
        }
      } catch (err: any) {
        // Silent fallback
      }
    }
    
    const local = readLocalDb();
    return Object.values(local)
      .filter(c => c.isPublic !== false)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async incrementViews(slug: string): Promise<void> {
    const cleanSlug = slug.toLowerCase().trim();
    const useMongo = await connectToMongo();
    
    if (useMongo && CollectionModel) {
      try {
        await CollectionModel.updateOne({ id: cleanSlug }, { $inc: { views: 1 } });
      } catch (err: any) {
        // Silent fallback
      }
    }
    
    const local = readLocalDb();
    if (local[cleanSlug]) {
      local[cleanSlug].views = (local[cleanSlug].views || 0) + 1;
      writeLocalDb(local);
    }
  },

  async incrementClickCount(slug: string, linkId: string): Promise<void> {
    const cleanSlug = slug.toLowerCase().trim();
    const useMongo = await connectToMongo();
    
    if (useMongo && CollectionModel) {
      try {
        await CollectionModel.updateOne(
          { id: cleanSlug, "links.id": linkId },
          { $inc: { "links.$.clickCount": 1 } }
        );
      } catch (err: any) {
        // Silent fallback
      }
    }
    
    const local = readLocalDb();
    if (local[cleanSlug] && local[cleanSlug].links) {
      local[cleanSlug].links = local[cleanSlug].links.map(lnk => {
        if (lnk.id === linkId) {
          return { ...lnk, clickCount: (lnk.clickCount || 0) + 1 };
        }
        return lnk;
      });
      writeLocalDb(local);
    }
  }
};
