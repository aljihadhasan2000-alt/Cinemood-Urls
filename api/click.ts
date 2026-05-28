import { dbService } from "./_db";

export default async function handler(req: any, res: any) {
  const { slug, linkId } = req.query;

  if (!slug || !linkId) {
    return res.status(400).json({ success: false, error: "Slug and linkId parameters are required." });
  }

  try {
    const cleanSlug = String(slug).toLowerCase().trim();
    await dbService.incrementClickCount(cleanSlug, String(linkId));
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Click count increase failure:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to log click interaction." });
  }
}
