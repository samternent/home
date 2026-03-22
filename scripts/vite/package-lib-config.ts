import { builtinModules } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type PackageJsonShape = {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

function loadPackageJson(packageDir: string): PackageJsonShape {
  const packageJsonPath = resolve(packageDir, "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJsonShape;
}

function createPackageNames(packageJson: PackageJsonShape) {
  return new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
    ...Object.keys(packageJson.optionalDependencies || {}),
  ]);
}

function isExternalId(id: string, packageNames: Set<string>, includeNodeBuiltins: boolean) {
  if (includeNodeBuiltins) {
    if (builtinModules.includes(id) || builtinModules.includes(id.replace(/^node:/, ""))) {
      return true;
    }
    if (id.startsWith("node:")) {
      return true;
    }
  }

  for (const packageName of packageNames) {
    if (id === packageName || id.startsWith(`${packageName}/`)) {
      return true;
    }
  }

  return false;
}

export function createPackageExternal(
  packageDir: string,
  options: { includeNodeBuiltins?: boolean } = {},
) {
  const packageJson = loadPackageJson(packageDir);
  const packageNames = createPackageNames(packageJson);
  const includeNodeBuiltins = options.includeNodeBuiltins === true;

  return function external(id: string) {
    return isExternalId(id, packageNames, includeNodeBuiltins);
  };
}

export function resolvePackageDir(metaUrl: string) {
  return dirname(fileURLToPath(metaUrl));
}
