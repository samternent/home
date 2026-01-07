import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const pkgPath = resolve("pkg", "package.json");
const data = JSON.parse(readFileSync(pkgPath, "utf8"));

data.publishConfig = {
  ...(data.publishConfig ?? {}),
  access: "public",
};

writeFileSync(pkgPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
