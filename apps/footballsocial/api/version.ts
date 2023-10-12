import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const __dirname = dirname(fileURLToPath(import.meta.url));

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