import { dbService } from "./_db";

export default async function handler(req: any, res: any) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ success: false, error: "Slug parameter is required." });
  }

  try {
    const cleanSlug = String(slug).toLowerCase().trim();
    const deleted = await dbService.delete(cleanSlug);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Collection not found." });
    }

    return res.status(200).json({ success: true, message: "Collection deleted successfully." });
  } catch (error: any) {
    console.log("Delete collection offset:", error?.message || error);
    return res.status(500).json({ success: false, error: error.message || "Failed to remove collection." });
  }
}
