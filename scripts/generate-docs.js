#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Documentation generation script for monorepo packages
 * Automatically adds JSDoc comments and creates README files
 */

const PACKAGES_DIR = path.join(__dirname, "../packages");

// Package configurations
const PACKAGE_CONFIGS = {
  "concord-protocol": {
    type: "typescript",
    description:
      "A TypeScript implementation of the Concord protocol core data structures and hashing rules.",
    features: [
      "Canonical Structures: Entry, Commit, and Ledger Container types",
      "Deterministic Hashing: EntryID and CommitID derivation",
      "Genesis Helpers: Create genesis commits with protocol metadata",
      "Canonical Serialization: Stable JSON hashing helpers",
      "Replay Support: Commit chain traversal utilities",
    ],
    mainFunctions: [
      "createLedger",
      "createGenesisCommit",
      "deriveEntryId",
      "deriveCommitId",
      "getCommitChain",
    ],
  },
  encrypt: {
    type: "typescript",
    description:
      "A modern encryption library using the age encryption format with support for both passphrase and public key encryption.",
    features: [
      "Age Encryption Standard: Modern, secure encryption using the age format",
      "Dual Encryption Methods: Support for both public key and passphrase encryption",
      "Automatic Detection: Automatically chooses encryption method based on key format",
      "Key Generation: Generate X25519 key pairs for public key encryption",
      "WebAssembly Performance: Built on rage-wasm for optimal performance",
      "TypeScript Support: Full TypeScript definitions included",
      "Armored Output: Human-readable armored format for encrypted data",
    ],
    mainFunctions: ["generate", "encrypt", "decrypt"],
  },
  "game-kit": {
    type: "typescript",
    description:
      "A lightweight game engine toolkit with animation loop management, scene handling, and sprite utilities.",
    features: [
      "Animation Loop Management: Built on requestAnimationFrame for smooth 60fps gameplay",
      "Scene Management: Create and manage multiple game scenes",
      "Sprite System: Handle sprite rendering and animations",
      "Event System: Register and manage game loop callbacks",
      "Performance Optimized: Efficient rendering and memory management",
      "TypeScript Support: Full type safety and IntelliSense support",
    ],
    mainFunctions: ["createEngine", "createScene", "createSprite"],
  },
  identity: {
    type: "typescript",
    description:
      "Cryptographic identity management with ECDSA key generation, digital signatures, and identity verification.",
    features: [
      "ECDSA Key Generation: Generate P-256 elliptic curve key pairs",
      "Digital Signatures: Sign and verify data with cryptographic signatures",
      "Key Import/Export: Import and export keys in various formats",
      "Identity Verification: Verify digital identities and signatures",
      "Web Crypto API: Built on standard Web Crypto API for security",
      "TypeScript Support: Full type definitions included",
    ],
    mainFunctions: [
      "createIdentity",
      "signData",
      "verifySignature",
      "exportKey",
      "importKey",
    ],
  },
  utils: {
    type: "typescript",
    description:
      "Common utility functions for string manipulation, cryptographic operations, and data formatting.",
    features: [
      "String Utilities: Format and manipulate strings with newlines and formatting",
      "Cryptographic Helpers: Utilities for working with keys and encrypted data",
      "ID Generation: Generate unique identifiers using crypto APIs",
      "Data Conversion: Convert between different data formats (base64, ArrayBuffer)",
      "Key Formatting: Format and strip cryptographic keys",
      "Browser Compatible: Works in all modern browsers",
    ],
    mainFunctions: [
      "generateId",
      "arrayBufferToBase64",
      "base64ToArrayBuffer",
      "formatIdentityKey",
    ],
  },
  ledger: {
    type: "typescript",
    description:
      "A ledger system for recording and managing transactions with cryptographic integrity.",
    features: [
      "Transaction Management: Record and track transactions",
      "Cryptographic Integrity: Secure transaction recording",
      "Query System: Search and filter transaction records",
      "Export/Import: Save and load ledger data",
      "TypeScript Support: Full type safety",
    ],
    mainFunctions: ["createLedger", "addTransaction", "queryTransactions"],
  },
  blockchain: {
    type: "rust-wasm",
    description:
      "Concord protocol core implemented in Rust and compiled to WebAssembly.",
    features: [
      "WebAssembly Performance: Written in Rust and compiled to WASM",
      "Canonical Hashing: SHA-256 over canonical JSON",
      "Entry and Commit IDs: Deterministic ID derivation helpers",
      "Genesis Helpers: Create genesis commits and ledgers",
      "Replay Support: Commit chain traversal utilities",
    ],
    mainFunctions: [
      "createLedger",
      "createGenesisCommit",
      "deriveEntryId",
      "deriveCommitId",
      "getCommitChain",
    ],
  },
  ragejs: {
    type: "rust-wasm",
    description:
      "Rust/WebAssembly implementation providing high-performance cryptographic operations.",
    features: [
      "WebAssembly Performance: Rust-based cryptographic operations",
      "Cross-platform: Works in browsers and Node.js",
      "Memory Safe: Rust's memory safety guarantees",
      "High Performance: Optimized cryptographic algorithms",
    ],
    mainFunctions: [],
  },
  "ternent-ui": {
    type: "typescript",
    description:
      "A collection of reusable UI components built with modern web technologies.",
    features: [
      "Component Library: Reusable UI components",
      "TypeScript Support: Full type definitions",
      "Theming Support: Customizable themes and styles",
      "Responsive Design: Mobile-first responsive components",
      "Accessibility: WCAG compliant components",
    ],
    mainFunctions: [],
  },
};

// JSDoc comment patterns for common TypeScript patterns
const JSDOC_PATTERNS = {
  exportFunction: (name, description, params = [], returns = "void") => `/**
 * ${description}
${params.map((p) => ` * @param ${p.name} - ${p.description}`).join("\n")}
 * @returns ${returns}
 * @example
 * \`\`\`typescript
 * // Example usage here
 * \`\`\`
 */`,

  exportInterface: (name, description) => `/**
 * ${description}
 */`,

  exportClass: (name, description) => `/**
 * ${description}
 */`,
};

// README template generator
function generateReadmeTemplate(packageName, config) {
  const { description, features, mainFunctions, type } = config;

  return `# ${
    packageName.charAt(0).toUpperCase() + packageName.slice(1)
  } Package

${description}

## Overview

${description}

## Features

${features
  .map(
    (feature) =>
      `- ✅ **${feature.split(":")[0]}**: ${feature.split(":")[1] || feature}`
  )
  .join("\n")}

## Installation

\`\`\`bash
npm install @your-org/${packageName}
\`\`\`

## Quick Start

\`\`\`typescript
import { ${mainFunctions
    .slice(0, 3)
    .join(", ")} } from '@your-org/${packageName}';

// Example usage
// TODO: Add specific examples for ${packageName}
\`\`\`

## API Reference

### Functions

${mainFunctions
  .map(
    (func) => `#### \`${func}()\`
// TODO: Add documentation for ${func}

`
  )
  .join("")}

## Usage Examples

### Basic Example

\`\`\`typescript
// TODO: Add comprehensive examples for ${packageName}
\`\`\`

## Dependencies

See \`package.json\` for current dependencies.

${
  type === "rust-wasm"
    ? `
## Building from Source

\`\`\`bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build the package
wasm-pack build --target bundler
\`\`\`
`
    : ""
}

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests with \`npm test\`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
`;
}

// Function to add JSDoc comments to TypeScript files
function addJSDocToFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const newLines = [];
  let inJSDoc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip if already has JSDoc
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

    // Add JSDoc for exports
    if (trimmed.startsWith("export function") && !inJSDoc) {
      const funcMatch = trimmed.match(/export function (\w+)/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        newLines.push(`/**`);
        newLines.push(` * ${funcName} function - TODO: Add description`);
        newLines.push(` * @param TODO - Add parameters`);
        newLines.push(` * @returns TODO - Add return type description`);
        newLines.push(` */`);
      }
    } else if (trimmed.startsWith("export interface") && !inJSDoc) {
      const interfaceMatch = trimmed.match(/export interface (\w+)/);
      if (interfaceMatch) {
        const interfaceName = interfaceMatch[1];
        newLines.push(`/**`);
        newLines.push(` * ${interfaceName} interface - TODO: Add description`);
        newLines.push(` */`);
      }
    } else if (trimmed.startsWith("export class") && !inJSDoc) {
      const classMatch = trimmed.match(/export class (\w+)/);
      if (classMatch) {
        const className = classMatch[1];
        newLines.push(`/**`);
        newLines.push(` * ${className} class - TODO: Add description`);
        newLines.push(` */`);
      }
    }

    newLines.push(line);
  }

  // Only write if changes were made
  const newContent = newLines.join("\n");
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Added JSDoc comments to ${filePath}`);
  }
}

// Function to generate README for a package
function generatePackageReadme(packageDir, packageName) {
  const readmePath = path.join(packageDir, "README.md");
  const config = PACKAGE_CONFIGS[packageName];

  if (!config) {
    console.log(`⚠️  No configuration found for package: ${packageName}`);
    return;
  }

  // Only generate if README doesn't exist or is a template
  let shouldGenerate = false;
  if (!fs.existsSync(readmePath)) {
    shouldGenerate = true;
  } else {
    const content = fs.readFileSync(readmePath, "utf8");
    if (content.includes("A brief description of what your project does")) {
      shouldGenerate = true;
    }
  }

  if (shouldGenerate) {
    const readme = generateReadmeTemplate(packageName, config);
    fs.writeFileSync(readmePath, readme);
    console.log(`✅ Generated README for ${packageName}`);
  } else {
    console.log(`📄 README already exists for ${packageName}`);
  }
}

// Function to process a TypeScript package
function processTypeScriptPackage(packageDir, packageName) {
  const srcDir = path.join(packageDir, "src");
  if (!fs.existsSync(srcDir)) return;

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
  console.log(
    `📁 Processing ${tsFiles.length} TypeScript files in ${packageName}`
  );

  tsFiles.forEach((file) => {
    addJSDocToFile(file);
  });
}

// Main execution function
function main() {
  console.log("🚀 Starting documentation generation for all packages...\n");

  if (!fs.existsSync(PACKAGES_DIR)) {
    console.error("❌ Packages directory not found:", PACKAGES_DIR);
    return;
  }

  const packages = fs.readdirSync(PACKAGES_DIR).filter((item) => {
    const packagePath = path.join(PACKAGES_DIR, item);
    return fs.statSync(packagePath).isDirectory() && item !== "node_modules";
  });

  console.log(
    `📦 Found ${packages.length} packages:`,
    packages.join(", "),
    "\n"
  );

  for (const packageName of packages) {
    console.log(`\n📦 Processing package: ${packageName}`);
    const packageDir = path.join(PACKAGES_DIR, packageName);
    const config = PACKAGE_CONFIGS[packageName];

    // Generate README
    generatePackageReadme(packageDir, packageName);

    // Process TypeScript files
    if (config && config.type === "typescript") {
      processTypeScriptPackage(packageDir, packageName);
    } else if (config && config.type === "rust-wasm") {
      console.log(
        `🦀 Skipping Rust package ${packageName} (use cargo doc for Rust documentation)`
      );
    } else {
      console.log(`⚠️  Unknown package type for ${packageName}`);
    }
  }

  console.log("\n✨ Documentation generation complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Review generated README files and customize them");
  console.log("2. Fill in TODO comments in JSDoc blocks");
  console.log("3. Add specific examples for each package");
  console.log("4. Update package.json descriptions if needed");
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateReadmeTemplate,
  addJSDocToFile,
  PACKAGE_CONFIGS,
};
