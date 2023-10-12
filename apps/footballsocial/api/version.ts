import { readFileSync } from "fs";
import { join } from "path";
import type { VercelRequest, VercelResponse } from '@vercel/node';
 
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (!request.url) return response.status(400);
 
   // too tight. do fix
  const { version } = JSON.parse(
    await readFileSync(
      join(__dirname, "../package.json"),
      "utf8"
    )
  );
 
  return response.status(200).json({ version });
}