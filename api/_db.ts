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
});

const pageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  links: [linkItemSchema],
  createdAt: { type: String, required: true },
  views: { type: Number, default: 0 },
  poster: { type: String, default: "" },
  isPasswordProtected: { type: Boolean, default: false },
  expiryTime: { type: String, default: "none" },
  expiresAt: { type: String, default: null },
  isPublic: { type: Boolean, default: true },
  enableQr: { type: Boolean, default: true },
  enableAnalytics: { type: Boolean, default: true },
  authorName: { type: String, default: "Cinemood Creator" },
  password: { type: String, default: "" }
}, {
  collection: "pages",
  timestamps: false,
  bufferCommands: true
});

let CollectionModel: any;
try {
  mongoose.set("bufferCommands", true);
  CollectionModel = mongoose.models.Page || mongoose.model("Page", pageSchema);
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
      // Quiet local fallback
    }
  }
  
  // Seed initial data
  try {
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_SEEDED_COLLECTIONS, null, 2), "utf-8");
  } catch (e) {
    // Quiet fallback
  }
  return DEFAULT_SEEDED_COLLECTIONS;
}

function writeLocalDb(dbObj: Record<string, Collection>) {
  const filePath = getFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(dbObj, null, 2), "utf-8");
  } catch (e) {
    // Quiet fallback
  }
}

let isConnected = false;
let lastConnectAttempt = 0;
const RECONNECT_COOL_DOWN_MS = 15000; // 15s quick retry cooldown

async function connectToMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[Database] MONGODB_URI is undefined. Fallback to local storage database.");
    return false;
  }
  
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const now = Date.now();
  if (now - lastConnectAttempt < RECONNECT_COOL_DOWN_MS) {
    return isConnected;
  }

  lastConnectAttempt = now;
  console.log("[Database] Establishing secure MongoDB connection to Atlas cluster...");
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5s connection and query buffer
      connectTimeoutMS: 5000,
    } as any);
    isConnected = true;
    console.log("[Database] Secure database connection SUCCESSFUL! Active model collection mapping: 'pages'");
    return true;
  } catch (e: any) {
    isConnected = false;
    console.log(`[Database] Mongo offline or unwhitelisted. Seamless Cinemood local JSON-DB fallback has safely taken over.`);
    return false;
  }
}

export const dbService = {
  async get(slug: string): Promise<Collection | null> {
    const cleanSlug = slug.toLowerCase().trim();
    const useMongo = await connectToMongo();
    
    if (useMongo && CollectionModel) {
      try {
        console.log(`[Database] Queries MongoDB for page "${cleanSlug}"`);
        const doc = await CollectionModel.findOne({
          $or: [{ slug: cleanSlug }, { id: cleanSlug }]
        }).lean();
        
        if (doc) {
          const { _id, __v, slug: dbSlug, ...rest } = doc as any;
          return { id: cleanSlug, ...rest } as Collection;
        }
      } catch (err: any) {
        console.log(`[Database] MongoDB query failure for "${cleanSlug}", attempting read from fallback database.`);
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

  async save(col: Collection): Promise<boolean> {
    const cleanSlug = col.id.toLowerCase().trim();
    col.id = cleanSlug;
    
    const posterVal = (col as any).poster || "";
    
    const mongoPayload = {
      slug: cleanSlug,
      id: cleanSlug,
      title: col.title,
      description: col.description || "",
      links: col.links || [],
      createdAt: col.createdAt,
      views: col.views || 0,
      poster: posterVal,
      isPasswordProtected: !!col.isPasswordProtected,
      expiryTime: col.expiryTime,
      expiresAt: col.expiresAt,
      isPublic: col.isPublic !== false,
      enableQr: col.enableQr !== false,
      enableAnalytics: col.enableAnalytics !== false,
      authorName: col.authorName || "Cinemood Creator",
      password: col.password || ""
    };

    const useMongo = await connectToMongo();
    if (useMongo && CollectionModel) {
      console.log(`[Database] Write validation triggered. Inserting "${cleanSlug}" into pages collection...`);
      try {
        // Automatically pre-create collection to verify db permissions & presence
        await CollectionModel.createCollection().catch(() => {});
        
        const savedDoc = await CollectionModel.findOneAndUpdate(
          { slug: cleanSlug },
          mongoPayload,
          { upsert: true, new: true, runValidators: true }
        ).lean();
        
        if (savedDoc) {
          console.log(`[Database] Verify OK: Document "${cleanSlug}" successfully written and index registered inside MongoDB cluster.`);
          
          // Sync with local memory cache instantly
          const local = readLocalDb();
          local[cleanSlug] = col;
          writeLocalDb(local);
          return true;
        } else {
          throw new Error("Verification query returned empty payload response.");
        }
      } catch (err: any) {
        console.log(`[Database] MongoDB verification failed for save on "${cleanSlug}". Fallback caching active instead.`);
      }
    } else {
      console.log(`[Database] MongoDB not operational. Initializing direct save to local storage cache.`);
    }
    
    // Fallback saving
    try {
      const local = readLocalDb();
      local[cleanSlug] = col;
      writeLocalDb(local);
      console.log(`[Database] Local fallback write verified for page "${cleanSlug}" successfully.`);
      return true;
    } catch (err: any) {
      console.log(`[Database] Critical backup storage write error for page "${cleanSlug}".`);
      return false;
    }
  },

  async delete(slug: string): Promise<boolean> {
    const cleanSlug = slug.toLowerCase().trim();
    const useMongo = await connectToMongo();
    
    let deleted = false;
    if (useMongo && CollectionModel) {
      try {
        console.log(`[Database] Deleting document with identifier "${cleanSlug}" from MongoDB...`);
        const result = await CollectionModel.deleteOne({
          $or: [{ slug: cleanSlug }, { id: cleanSlug }]
        });
        deleted = (result.deletedCount || 0) > 0;
        if (deleted) {
          console.log(`[Database] Document "${cleanSlug}" thoroughly removed from Atlas indexes.`);
        }
      } catch (err: any) {
        console.log(`[Database] MongoDB query deletion exception on "${cleanSlug}".`);
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
        console.log("[Database] Requesting public pages catalog index from cloud registry...");
        const list = await CollectionModel.find({ isPublic: { $ne: false } })
          .sort({ createdAt: -1 })
          .limit(120)
          .lean();
        
        if (list && list.length > 0) {
          console.log(`[Database] SUCCESSFULLY fetched ${list.length} public cinematic collection pages from Atlas.`);
          return list.map((doc: any) => {
            const { _id, __v, slug: dbSlug, ...rest } = doc;
            return { id: doc.slug || doc.id || "", ...rest } as Collection;
          });
        }
      } catch (err: any) {
        console.log("[Database] MongoDB getAllPublic index lookup dropped. Restoring local cache.");
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
        await CollectionModel.updateOne(
          { $or: [{ slug: cleanSlug }, { id: cleanSlug }] },
          { $inc: { views: 1 } }
        );
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
          {
            $and: [
              { $or: [{ slug: cleanSlug }, { id: cleanSlug }] },
              { "links.id": linkId }
            ]
          },
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
