import { dbService } from "./_db";

export default async function handler(req: any, res: any) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ success: false, error: "Slug parameter is required." });
  }

  try {
    const cleanSlug = String(slug).toLowerCase().trim();
    const collection = await dbService.get(cleanSlug);

    if (!collection) {
      return res.status(404).json({ success: false, error: "Stage inaccessible. Slug truly does not exist." });
    }

    // Check expiry
    if (collection.expiresAt) {
      const expiryDate = new Date(collection.expiresAt);
      if (expiryDate.getTime() < Date.now()) {
        // Automatically purge expired collections to prevent route bloat/crashes
        await dbService.delete(cleanSlug);
        return res.status(410).json({ success: false, error: "This cinematic collection has expired and was purged." });
      }
    }

    // Increment view count securely on view load
    await dbService.incrementViews(cleanSlug);
    collection.views = (collection.views || 0) + 1;

    // Secure password protection: hide original password on normal response
    const responsePayload = { ...collection };
    if (responsePayload.isPasswordProtected) {
      delete responsePayload.password; // Do not send actual password to client
    }

    return res.status(200).json({ success: true, collection: responsePayload });
  } catch (error: any) {
    console.error("Retrieve collection error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load index stage." });
  }
}
