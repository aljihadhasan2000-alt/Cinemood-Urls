import { dbService } from "./_db";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { 
      title, 
      description, 
      links, 
      id, 
      isPasswordProtected, 
      password, 
      expiryTime, 
      expiresAt, 
      isPublic, 
      enableQr, 
      enableAnalytics, 
      authorName,
      isSync,
      poster
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: "Title is required" });
    }

    // Standardize slug rules
    let baseSlug = (id || title).trim();
    let sanitizedSlug = baseSlug
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_]+/g, "-")  // Spaces and underscores to hyphens
      .replace(/-+/g, "-");     // Strip multiple hyphens

    if (sanitizedSlug.startsWith("-")) sanitizedSlug = sanitizedSlug.substring(1);
    if (sanitizedSlug.endsWith("-")) sanitizedSlug = sanitizedSlug.substring(0, sanitizedSlug.length - 1);

    if (!sanitizedSlug) {
      sanitizedSlug = "collection-" + Date.now().toString().slice(-4);
    }

    let targetSlug = sanitizedSlug;

    // Handle background sync/restore:
    // If isSync is true and the slug doesn't exist, use targetSlug exactly to restore it!
    // If it exists, check if it's the exact same collection (we can safely skip duplication or update view differences).
    if (isSync) {
      const existing = await dbService.get(targetSlug);
      if (existing) {
        // Already successfully restored/preserved, just return it
        return res.status(200).json({ success: true, collection: existing, isSynced: true });
      }
    } else {
      // Ensure route consistency and prevent duplicate slugs for normal creations
      let existing = await dbService.get(targetSlug);
      let counter = 1;
      while (existing) {
        targetSlug = `${sanitizedSlug}-${counter}`;
        existing = await dbService.get(targetSlug);
        counter++;
      }
    }

    const payload = {
      id: targetSlug,
      title: title.trim(),
      description: (description || "").trim(),
      links: (links || []).map((lnk: any, idx: number) => ({
        id: lnk.id || String(idx + 1),
        title: lnk.title ? lnk.title.trim() : "Download Link",
        url: lnk.url ? lnk.url.trim() : "",
        clickCount: lnk.clickCount || 0
      })),
      createdAt: req.body.createdAt || new Date().toISOString(),
      views: req.body.views || 0,
      isPasswordProtected: !!isPasswordProtected,
      password: password || "",
      expiryTime: expiryTime || "none",
      expiresAt: expiresAt || null,
      isPublic: isPublic !== false,
      enableQr: enableQr !== false,
      enableAnalytics: enableAnalytics !== false,
      authorName: (authorName || "Cinemood Creator").trim(),
      poster: poster || ""
    };

    const isSaved = await dbService.save(payload);
    if (!isSaved) {
      return res.status(500).json({ success: false, error: "Database storage insertion failure, verify rejected." });
    }

    return res.status(201).json({ success: true, collection: payload });
  } catch (error: any) {
    console.log("Error creating Cinemood collection registry:", error?.message || error);
    return res.status(500).json({ success: false, error: error.message || "Failed to create public registry." });
  }
}
