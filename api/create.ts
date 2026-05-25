import { fetchAllCollections, saveOneCollection, Collection, LinkItem } from "./_db";

export default async function handler(req: any, res: any) {
  // Ensure the response always returns application/json
  res.setHeader("Content-Type", "application/json");

  // Prevent CORS issues
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Method '${req.method}' not allowed.`
    });
  }

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
    } = req.body || {};

    // Validate body payload
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Collection Title is required."
      });
    }

    if (!links || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one link node is required."
      });
    }

    const collections = await fetchAllCollections();

    // Process and validate slug
    let slug = customSlug ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "") : "";
    if (slug) {
      const exists = collections.find(c => c.id === slug);
      if (exists) {
        return res.status(400).json({
          success: false,
          error: "Slug is already taken. Try another custom slug or leave empty."
        });
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

    // Format safe links
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

    // Compute canonical URL links
    let baseUrl = process.env.APP_URL || process.env.VITE_APP_URL || "";
    if (!baseUrl) {
      const host = req.headers.host || "";
      const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL || (!host.includes("localhost") && !host.includes("3000") && !host.includes("ais-dev") && !host.includes("run.app"));
      if (isProduction) {
        baseUrl = "https://cinemoodurls.site";
      } else {
        const protocol = req.headers["x-forwarded-proto"] || "https";
        baseUrl = `${protocol}://${host || "localhost:3000"}`;
      }
    }
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

  } catch (error: any) {
    console.error("API create collection error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "A secure server error occurred while creating collection."
    });
  }
}
