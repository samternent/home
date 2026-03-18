import { hashCanonical } from "./crypto";
import type { StickerEntry } from "./generator";

export type MerkleProof = { position: "left" | "right"; hash: string }[];

export async function computeMerkleRoot(entries: StickerEntry[]) {
  const leafHashes = await Promise.all(
    entries.map((entry) => hashCanonical(entry))
  );
  if (!leafHashes.length) return hashCanonical([]);
  let level = leafHashes.slice();
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      next.push(await hashCanonical({ left, right }));
    }
    level = next;
  }
  return level[0];
}

export async function generateProof(
  entries: StickerEntry[],
  index: number
): Promise<MerkleProof> {
  const leafHashes = await Promise.all(
    entries.map((entry) => hashCanonical(entry))
  );
  if (index < 0 || index >= leafHashes.length) return [];
  let idx = index;
  let level = leafHashes.slice();
  const proof: MerkleProof = [];

  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      next.push(await hashCanonical({ left, right }));

      if (i === idx || i + 1 === idx) {
        if (idx === i) {
          proof.push({ position: "right", hash: right });
        } else {
          proof.push({ position: "left", hash: left });
        }
        idx = Math.floor(i / 2);
      }
    }
    level = next;
  }

  return proof;
}

export async function verifyProof(
  entry: StickerEntry,
  proof: MerkleProof,
  packRoot: string
) {
  let current = await hashCanonical(entry);
  for (const step of proof || []) {
    if (step.position === "left") {
      current = await hashCanonical({ left: step.hash, right: current });
    } else {
      current = await hashCanonical({ left: current, right: step.hash });
    }
  }
  return current === packRoot;
}

export async function deriveStickerId(packRoot: string, index: number) {
  return hashCanonical({ packRoot, index });
}
