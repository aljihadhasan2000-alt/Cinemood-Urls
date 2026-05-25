import { fetchAllCollections } from "./_db";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: `Method '${req.method}' not allowed.`
    });
  }

  try {
    const collections = await fetchAllCollections();

    const trending = collections
      .filter(c => c.isPublic && !c.isPasswordProtected)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
      .map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        views: c.views,
        linksCount: c.links.length,
        createdAt: c.createdAt,
        authorName: c.authorName
      }));

    return res.status(200).json(trending);

  } catch (error: any) {
    console.error("API GET trending error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unhandled error occurred gathering trending stats."
    });
  }
}
