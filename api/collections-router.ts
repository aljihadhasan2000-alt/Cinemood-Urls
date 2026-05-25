import getHandler from "./get";
import deleteHandler from "./delete";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return getHandler(req, res);
  } else if (req.method === "DELETE") {
    return deleteHandler(req, res);
  } else if (req.method === "OPTIONS") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-cinemood-password");
    return res.status(200).end();
  } else {
    res.setHeader("Content-Type", "application/json");
    return res.status(405).json({
      success: false,
      error: `Method '${req.method}' not allowed on dynamic collection routes.`
    });
  }
}
