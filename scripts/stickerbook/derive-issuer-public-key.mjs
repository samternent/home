import { execSync } from "child_process";
import { readFileSync } from "fs";

function loadPem() {
  if (process.env.ISSUER_PRIVATE_KEY_PEM) {
    return process.env.ISSUER_PRIVATE_KEY_PEM;
  }
  const filePath = process.argv[2];
  if (filePath) {
    return readFileSync(filePath, "utf8");
  }
  return "";
}

const pem = loadPem();
if (!pem) {
  console.error(
    "Provide ISSUER_PRIVATE_KEY_PEM or a file path argument.\n" +
      "Example: ISSUER_PRIVATE_KEY_PEM='...PEM...' node scripts/stickerbook/derive-issuer-public-key.mjs\n" +
      "Example: node scripts/stickerbook/derive-issuer-public-key.mjs /path/to/key.pem"
  );
  process.exit(1);
}

const output = execSync("openssl pkey -pubout", { input: pem });
process.stdout.write(output);
