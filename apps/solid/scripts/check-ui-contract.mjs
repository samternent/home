#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(appRoot, "src");

const sourceFiles = [];
const vueFiles = [];

walk(srcRoot);

const importViolations = [];
const controlViolations = [];

const legacyImportRegex =
  /(?:from\s*["']ternent-ui\/components["']|import\(\s*["']ternent-ui\/components["']\s*\))/g;

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relativeFile = path.relative(appRoot, file);

  for (const match of source.matchAll(legacyImportRegex)) {
    const line = getLineNumber(source, match.index ?? 0);
    importViolations.push({
      file: relativeFile,
      line,
      message: "legacy import from ternent-ui/components",
    });
  }
}

for (const file of vueFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relativeFile = path.relative(appRoot, file);

  const templateMatch = source.match(/<template[\s\S]*<\/template>/i);
  if (!templateMatch) {
    continue;
  }

  const template = templateMatch[0];
  const templateStart = templateMatch.index ?? 0;
  const interactiveTagRegex = /<(button|input|textarea|select)\b([\s\S]*?)>/g;

  for (const match of template.matchAll(interactiveTagRegex)) {
    const tagName = (match[1] || "").toLowerCase();
    const attributes = match[2] || "";

    const hasStyleClass = /(?:\s|^)(?:class|:class)\s*=/.test(attributes);
    if (!hasStyleClass) {
      continue;
    }

    if (isAllowedControl(tagName, attributes)) {
      continue;
    }

    const line = getLineNumber(source, templateStart + (match.index ?? 0));
    controlViolations.push({
      file: relativeFile,
      line,
      message: `styled native control <${tagName}>`,
    });
  }
}

const hasViolations = importViolations.length > 0 || controlViolations.length > 0;

if (!hasViolations) {
  console.log("UI contract check passed: no violations.");
  process.exit(0);
}

console.warn("UI contract warnings:\n");

for (const violation of [...importViolations, ...controlViolations]) {
  console.warn(`- ${violation.file}:${violation.line} ${violation.message}`);
}

if (strict) {
  process.exit(1);
}

process.exit(0);

function walk(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }

    if (entry.name.endsWith(".ts") || entry.name.endsWith(".vue")) {
      sourceFiles.push(entryPath);
    }

    if (entry.name.endsWith(".vue")) {
      vueFiles.push(entryPath);
    }
  }
}

function getLineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function isAllowedControl(tagName, attributes) {
  if (/\sdata-ui-contract-allow\b/.test(attributes)) {
    return true;
  }

  if (/\sdata-ui-contract-unmanaged\b/.test(attributes)) {
    return true;
  }

  if (tagName === "input" && /type\s*=\s*["']hidden["']/i.test(attributes)) {
    return true;
  }

  if (tagName === "input" && /class\s*=\s*["'][^"']*\bsr-only\b/i.test(attributes)) {
    return true;
  }

  return false;
}
