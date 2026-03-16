import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  namedSemanticThemes,
  rootSemanticThemes,
} from "../src/themes/semanticThemeContract.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const tokensCssPath = path.join(rootDir, "src/design-system/tokens.css");
const themesDir = path.join(rootDir, "src/themes");

const generatedHeader =
  "/* This file is generated from src/themes/semanticThemeContract.js. */";

const singletonThemeSelectors = {
  "neon-noir": {
    dark: "neon-noir",
  },
  proof: {
    dark: "proof-dark",
  },
};

function renderDeclaration([property, value], indent = "  ") {
  const normalizedValue = String(value)
    .trim()
    .replace(/[;,]+\s*$/, "");
  return `${indent}${property}: ${normalizedValue};`;
}

function renderRule(selector, declarations, indent = "") {
  const lines = [`${indent}${selector} {`];
  for (const entry of Object.entries(declarations)) {
    lines.push(renderDeclaration(entry, `${indent}  `));
  }
  lines.push(`${indent}}`);
  return lines.join("\n");
}

function renderRootCss() {
  const lightRule = renderRule(":root", rootSemanticThemes.light);
  const darkRule = renderRule(":root", rootSemanticThemes.dark, "  ");

  return [
    generatedHeader,
    "",
    lightRule,
    "",
    "@media (prefers-color-scheme: dark) {",
    darkRule,
    "}",
    "",
  ].join("\n");
}

function getThemeSelector(themeName, mode) {
  const singletonSelector = singletonThemeSelectors[themeName]?.[mode];
  if (singletonSelector) {
    return `[data-theme="${singletonSelector}"]`;
  }

  return `[data-theme="${themeName}-${mode}"]`;
}

function renderThemeCss(themeName, variants) {
  const sections = [generatedHeader, ""];

  for (const mode of ["light", "dark"]) {
    if (!variants[mode]) continue;
    sections.push(
      renderRule(getThemeSelector(themeName, mode), variants[mode]),
    );
    sections.push("");
  }

  return sections.join("\n");
}

fs.writeFileSync(tokensCssPath, renderRootCss());

for (const [themeName, variants] of Object.entries(namedSemanticThemes)) {
  const filePath = path.join(themesDir, `${themeName}.css`);
  fs.writeFileSync(filePath, renderThemeCss(themeName, variants));
}

console.log("Generated semantic theme CSS.");
