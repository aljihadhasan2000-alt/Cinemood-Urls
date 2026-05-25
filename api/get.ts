import { fetchOneCollection, saveOneCollection } from "./_db";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-cinemood-password");

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
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({
        success: false,
        error: "Collection unique slug parameter is required."
      });
    }

    const col = await fetchOneCollection(slug);
    if (!col) {
      return res.status(404).json({
        success: false,
        error: "Cinemood URLs collection not found or has expired."
      });
    }

    const clientPassword = (req.headers["x-cinemood-password"] || req.query.password) as string;

    if (col.isPasswordProtected) {
      if (!clientPassword || clientPassword !== col.password) {
        // Obfuscated representation: strip private details
        return res.status(200).json({
          id: col.id,
          title: col.title,
          description: col.description,
          authorName: col.authorName,
          createdAt: col.createdAt,
          views: col.views,
          isPasswordProtected: true,
          expiryTime: col.expiryTime,
          enableQr: col.enableQr,
          enableAnalytics: col.enableAnalytics
        });
      }
    }

    // Record views dynamically
    col.views = (col.views || 0) + 1;
    await saveOneCollection(col);

    // Strip password from payload response for security integrity
    const { password, ...safeCollection } = col;
    return res.status(200).json(safeCollection);

  } catch (error: any) {
    console.error("API GET collection error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unhandled error occurred retrieving collection."
    });
  }
}
