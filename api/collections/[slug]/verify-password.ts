import { fetchOneCollection, saveOneCollection } from "../../_db";

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
    const { slug } = req.query;
    const { password } = req.body || {};

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({
        success: false,
        error: "Slug key query parameter is required."
      });
    }

    const col = await fetchOneCollection(slug);
    if (!col) {
      return res.status(404).json({
        success: false,
        error: "Collection not found"
      });
    }

    if (col.password === password) {
      col.views = (col.views || 0) + 1;
      await saveOneCollection(col);

      const { password: _, ...safeCol } = col;
      return res.status(200).json({
        success: true,
        collection: safeCol
      });
    } else {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Access denied."
      });
    }

  } catch (error: any) {
    console.error("API POST verify-password error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred verifying collection credentials."
    });
  }
}
