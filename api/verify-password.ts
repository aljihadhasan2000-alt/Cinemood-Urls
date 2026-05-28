import { dbService } from "./_db";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  const { slug } = req.query;
  const { password } = req.body;

  if (!slug) {
    return res.status(400).json({ success: false, error: "Slug parameter is required." });
  }

  try {
    const cleanSlug = String(slug).toLowerCase().trim();
    const collection = await dbService.get(cleanSlug);

    if (!collection) {
      return res.status(404).json({ success: false, error: "Collection not found." });
    }

    if (!collection.isPasswordProtected) {
      return res.status(200).json({ success: true, authorized: true });
    }

    const isMatch = collection.password === password;
    if (isMatch) {
      // Return authorization payload and include the full details (like the links themselves)
      return res.status(200).json({ success: true, authorized: true, collection });
    } else {
      return res.status(401).json({ success: false, authorized: false, error: "Incorrect password shield code." });
    }
  } catch (error: any) {
    console.log("Password verification offset:", error?.message || error);
    return res.status(500).json({ success: false, error: error.message || "Failed to verify access." });
  }
}
