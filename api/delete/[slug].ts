import { deleteOneCollection } from "../_db";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      error: `Method '${req.method}' not allowed.`
    });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({
      success: false,
      error: "Slug parameter is required to delete."
    });
  }

  try {
    const deleted = await deleteOneCollection(slug);
    if (deleted) {
      return res.status(200).json({
        success: true,
        message: "Cinemood Collection deleted successfully."
      });
    } else {
      return res.status(404).json({
        success: false,
        error: "Collection not found"
      });
    }
  } catch (error: any) {
    console.error("API DELETE error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unhandled error occurred while destroying collection."
    });
  }
}
