import { fetchOneCollection, saveOneCollection } from "./_db";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
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
    const { slug, linkId } = req.query;

    if (!slug || typeof slug !== "string" || !linkId || typeof linkId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Both slug and linkId query parameters are required."
      });
    }

    const col = await fetchOneCollection(slug);
    if (!col) {
      return res.status(404).json({
        success: false,
        error: "Collection not found"
      });
    }

    const item = col.links.find(l => l.id === linkId);
    if (item) {
      item.clickCount = (item.clickCount || 0) + 1;
      await saveOneCollection(col);
      return res.status(200).json({
        success: true,
        clickCount: item.clickCount
      });
    }

    return res.status(404).json({
      success: false,
      error: "Link identifier not found inside collection"
    });

  } catch (error: any) {
    console.error("API POST click analytics error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred updating link analytics."
    });
  }
}
