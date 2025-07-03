#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Enhanced documentation generation script for monorepo packages
 * Analyzes function signatures and generates proper JSDoc comments
 */

const PACKAGES_DIR = path.join(__dirname, "../packages");

// Enhanced function signature parser
function parseFunctionSignature(line) {
  const patterns = [
    /export\s+function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^{]+)/, // With return type
    /export\s+function\s+(\w+)\s*\(([^)]*)\)/, // Without return type
    /export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^{]+)/, // Async with return type
    /export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)/, // Async without return type
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const [, name, params, returnType] = match;

      // Parse parameters
      const parsedParams = params
        .split(",")
        .map((p) => {
          const param = p.trim();
          if (!param) return null;

          const [paramName, paramType] = param.split(":").map((s) => s.trim());
          return {
            name: paramName,
            type: paramType || "any",
            optional: paramName.includes("?") || param.includes("="),
          };
        })
        .filter(Boolean);

      return {
        name,
        params: parsedParams,
        returnType: returnType ? returnType.trim() : "void",
        isAsync: line.includes("async"),
      };
    }
  }
  return null;
}

// Generate better JSDoc based on function signature
function generateJSDocForFunction(funcInfo) {
  const { name, params, returnType, isAsync } = funcInfo;

  // Try to infer description from function name
  const descriptions = {
    create: "Creates a new",
    generate: "Generates a new",
    add: "Adds",
    remove: "Removes",
    get: "Gets",
    set: "Sets",
    update: "Updates",
    delete: "Deletes",
    find: "Finds",
    format: "Formats",
    strip: "Strips",
    parse: "Parses",
    convert: "Converts",
    validate: "Validates",
    verify: "Verifies",
    sign: "Signs",
    encrypt: "Encrypts",
    decrypt: "Decrypts",
    hash: "Hashes",
    import: "Imports",
    export: "Exports",
  };

  let description = `${name} function`;
  for (const [prefix, desc] of Object.entries(descriptions)) {
    if (name.toLowerCase().startsWith(prefix)) {
      description = `${desc} ${
        name.substring(prefix.length).toLowerCase() || "data"
      }`;
      break;
    }
  }

  const lines = ["/**", ` * ${description}`];

  // Add parameter documentation
  params.forEach((param) => {
    const optional = param.optional ? " (optional)" : "";
    lines.push(
      ` * @param ${param.name} - The ${param.name} parameter${optional}`
    );
  });

  // Add return documentation
  if (isAsync) {
    lines.push(
      ` * @returns Promise that resolves to ${returnType
        .replace("Promise<", "")
        .replace(">", "")}`
    );
  } else {
    lines.push(` * @returns ${returnType}`);
  }

  // Add example
  lines.push(" * @example");
  lines.push(" * ```typescript");

  if (params.length === 0) {
    lines.push(` * const result = ${isAsync ? "await " : ""}${name}();`);
  } else {
    const exampleParams = params
      .map((p) => {
        if (p.type.includes("string")) return `"example"`;
        if (p.type.includes("number")) return "123";
        if (p.type.includes("boolean")) return "true";
        if (p.type.includes("Array")) return "[]";
        if (p.type.includes("Object") || p.type.includes("{")) return "{}";
        return `${p.name}Value`;
      })
      .join(", ");
    lines.push(
      ` * const result = ${isAsync ? "await " : ""}${name}(${exampleParams});`
    );
  }

  lines.push(" * ```");
  lines.push(" */");

  return lines.join("\n");
}

// Enhanced JSDoc addition function
function addEnhancedJSDocToFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const newLines = [];
  let inJSDoc = false;
  let hasChanges = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track JSDoc blocks
    if (trimmed.startsWith("/**")) {
      inJSDoc = true;
    }
    if (trimmed.endsWith("*/")) {
      inJSDoc = false;
      newLines.push(line);
      continue;
    }
    if (inJSDoc) {
      newLines.push(line);
      continue;
    }

    // Check for export function without JSDoc
    if (
      trimmed.startsWith("export function") ||
      trimmed.startsWith("export async function")
    ) {
      // Look back to see if there's already JSDoc
      let hasExistingJSDoc = false;
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();
        if (prevLine === "") continue;
        if (prevLine.startsWith("*/")) {
          hasExistingJSDoc = true;
        }
        break;
      }

      if (!hasExistingJSDoc) {
        const funcInfo = parseFunctionSignature(trimmed);
        if (funcInfo) {
          const jsdoc = generateJSDocForFunction(funcInfo);
          newLines.push(jsdoc);
          hasChanges = true;
        }
      }
    }

    // Add JSDoc for interfaces and classes
    else if (trimmed.startsWith("export interface") && !inJSDoc) {
      const interfaceMatch = trimmed.match(/export interface (\w+)/);
      if (interfaceMatch) {
        const interfaceName = interfaceMatch[1];
        newLines.push("/**");
        newLines.push(` * ${interfaceName} interface definition`);
        newLines.push(" */");
        hasChanges = true;
      }
    }

    newLines.push(line);
  }

  // Write file if changes were made
  if (hasChanges) {
    const newContent = newLines.join("\n");
    fs.writeFileSync(filePath, newContent);
    return true;
  }

  return false;
}

// Create an improved README cleanup function
function cleanupGeneratedReadme(readmePath, packageName) {
  if (!fs.existsSync(readmePath)) return;

  let content = fs.readFileSync(readmePath, "utf8");

  // Remove duplicate lines that might have been generated
  const lines = content.split("\n");
  const cleanLines = [];
  let prevLine = "";

  for (const line of lines) {
    if (line.trim() !== prevLine.trim() || line.trim() === "") {
      cleanLines.push(line);
    }
    prevLine = line;
  }

  content = cleanLines.join("\n");

  // Fix any malformed sections
  content = content.replace(/## Overview\s+## Overview/g, "## Overview");
  content = content.replace(/A (.*?)\.\1/g, "A $1.");

  fs.writeFileSync(readmePath, content);
}

// Main execution
async function main() {
  console.log("🔄 Running enhanced documentation generation...\n");

  // Re-run the enhanced JSDoc on all TypeScript files
  const packages = fs.readdirSync(PACKAGES_DIR).filter((item) => {
    const packagePath = path.join(PACKAGES_DIR, item);
    return fs.statSync(packagePath).isDirectory() && item !== "node_modules";
  });

  for (const packageName of packages) {
    console.log(`🔍 Enhancing documentation for: ${packageName}`);
    const packageDir = path.join(PACKAGES_DIR, packageName);
    const srcDir = path.join(packageDir, "src");

    if (fs.existsSync(srcDir)) {
      // Find all TypeScript files
      function findTSFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            files.push(...findTSFiles(fullPath));
          } else if (item.endsWith(".ts") && !item.endsWith(".d.ts")) {
            files.push(fullPath);
          }
        }

        return files;
      }

      const tsFiles = findTSFiles(srcDir);
      let enhancedCount = 0;

      for (const file of tsFiles) {
        if (addEnhancedJSDocToFile(file)) {
          enhancedCount++;
        }
      }

      if (enhancedCount > 0) {
        console.log(
          `  ✨ Enhanced ${enhancedCount} files with better JSDoc comments`
        );
      } else {
        console.log(`  ✅ JSDoc comments are up to date`);
      }
    }

    // Clean up README
    const readmePath = path.join(packageDir, "README.md");
    cleanupGeneratedReadme(readmePath, packageName);
  }

  console.log("\n🎉 Enhanced documentation generation complete!");
  console.log("\n📋 Summary of what was done:");
  console.log("• Generated proper JSDoc with parameter types and examples");
  console.log("• Cleaned up README files to remove duplicates");
  console.log("• Added intelligent function descriptions based on naming");
  console.log("• Enhanced parameter documentation with type information");
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  addEnhancedJSDocToFile,
  parseFunctionSignature,
  generateJSDocForFunction,
};
