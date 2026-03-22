import { hashData } from "ternent-utils";
import type {
  PixpaxCardCatalogEntry,
  PixpaxClaimantRef,
  PixpaxCollectionScope,
  PixpaxDropScope,
  PixpaxPackCard,
} from "./types.js";
import {
  createDeterministicIssuanceMaterial,
  normalizeCardCatalogEntry,
} from "./canonical.js";

function scoreHexToIndex(scoreHex: string, poolSize: number): number {
  const seed = scoreHex.slice(0, 12);
  const value = Number.parseInt(seed, 16);
  return value % poolSize;
}

export async function createDeterministicSelectionIndices(input: {
  claimant: PixpaxClaimantRef;
  scope: PixpaxCollectionScope;
  drop: PixpaxDropScope;
  count: number;
  poolSize: number;
}): Promise<number[]> {
  const poolSize = Number(input.poolSize);
  if (!Number.isInteger(poolSize) || poolSize < 1) {
    throw new Error("poolSize must be a positive integer.");
  }
  const count = Number(input.count);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer.");
  }
  if (count > poolSize) {
    throw new Error("count cannot exceed the available card pool size.");
  }

  const material = await createDeterministicIssuanceMaterial(input);
  const materialHash = await hashData(material);
  const indices: number[] = [];
  const availableIndices = Array.from({ length: poolSize }, (_, index) => index);

  for (let slotIndex = 0; slotIndex < count; slotIndex += 1) {
    const slotHash = await hashData({
      type: "pixpax-deterministic-slot",
      materialHash,
      slotIndex,
    });
    const remainingIndex = scoreHexToIndex(slotHash, availableIndices.length);
    const [poolIndex] = availableIndices.splice(remainingIndex, 1);
    indices.push(poolIndex);
  }

  return indices;
}

export async function selectDeterministicPackCards(input: {
  claimant: PixpaxClaimantRef;
  scope: PixpaxCollectionScope;
  drop: PixpaxDropScope;
  count: number;
  pool: PixpaxCardCatalogEntry[];
}): Promise<{
  materialHash: string;
  cards: PixpaxPackCard[];
}> {
  const pool = Array.isArray(input.pool) ? input.pool : [];
  if (pool.length === 0) {
    throw new Error("pool must contain at least one card.");
  }

  const material = await createDeterministicIssuanceMaterial(input);
  const materialHash = await hashData(material);
  const indices = await createDeterministicSelectionIndices({
    claimant: input.claimant,
    scope: input.scope,
    drop: input.drop,
    count: material.count,
    poolSize: pool.length,
  });

  return {
    materialHash,
    cards: indices.map((poolIndex, slotIndex) =>
      normalizeCardCatalogEntry(pool[poolIndex], slotIndex),
    ),
  };
}
