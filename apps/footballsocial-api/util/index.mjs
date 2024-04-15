import jwt from "jsonwebtoken";

export function isAuthenticated(req) {
  const accessToken = req.headers["access-token"];
  if (accessToken) {
    const decoded = jwt.verify(accessToken, process.env.SUPABASE_JWT_SECRET);
    if (decoded.role === "authenticated") {
      return true;
    }
  }
  return false;
}
