import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.resolve(__dirname, '../src/components');
const styleFile = path.resolve(__dirname, '../src/style.css');

/**
 * Recursively collect files matching the given extensions.
 */
const collectFiles = (dir, extensions) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [fullPath] : [];
  });
};

const filesToCheck = [
  ...collectFiles(componentsDir, ['.vue', '.js', '.ts']),
  styleFile,
];

const arbitraryValuePattern = /\[[^\]]*?\d+(?:\.\d+)?(?:px|rem)[^\]]*?\]/g;
const hardCodedUnitPattern = /\b\d+(?:\.\d+)?(?:px|rem)\b/g;

const issues = [];

for (const file of filesToCheck) {
  const content = fs.readFileSync(file, 'utf8');

  const arbitraryMatches = content.match(arbitraryValuePattern) || [];
  if (arbitraryMatches.length) {
    issues.push({ file, matches: arbitraryMatches, reason: 'arbitrary values' });
  }

  if (file.endsWith('.css')) {
    const unitMatches = (content.match(hardCodedUnitPattern) || []).filter(
      (match) => parseFloat(match) !== 0
    );
    if (unitMatches.length) {
      issues.push({ file, matches: unitMatches, reason: 'hardcoded CSS units' });
    }
  }
}

if (issues.length) {
  console.error('Found hardcoded values that should map to design tokens:');
  for (const { file, matches, reason } of issues) {
    console.error(`- ${file} (${reason}): ${[...new Set(matches)].join(', ')}`);
  }
  process.exit(1);
}

console.log('Token lint passed: no hardcoded px/rem values detected.');
