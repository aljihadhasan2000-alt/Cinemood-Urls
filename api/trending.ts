import { dbService } from "./_db";

export default async function handler(req: any, res: any) {
  try {
    const list = await dbService.getAllPublic();
    
    // Sort primarily by views descending, fallback to creation time
    const formattedList = list.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      views: item.views || 0,
      linksCount: item.links ? item.links.length : 0,
      createdAt: item.createdAt,
      authorName: item.authorName || "Cinemood Curator"
    }));

    return res.status(200).json({ success: true, collections: formattedList });
  } catch (error: any) {
    console.error("Fetch trending stages error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load trending assets." });
  }
}
