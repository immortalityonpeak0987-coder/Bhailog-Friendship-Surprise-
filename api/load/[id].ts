export default function handler(req: any, res: any) {
  // Return 501 Not Implemented to force the client to use the DB-less base64 URL sharing method.
  res.status(501).json({ error: "DB-less mode active" });
}
