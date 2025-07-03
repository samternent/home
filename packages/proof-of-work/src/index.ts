import { hashData } from "concords-utils";

/**
 * Represents the result of a proof-of-work computation
 */
/**
 * IProof interface definition
 */
export interface IProof {
  /** The computed hash proof */
  proof: string;
  /** The nonce value that produced the proof */
  nonce: number;
}

/**
 * Represents a single record in the blockchain
 */
/**
 * IRecord interface definition
 */
export interface IRecord {
  /** Unique identifier for the record */
  id: string;
  /** Unix timestamp when the record was created */
  timestamp: number;
  /** Optional digital signature for verification */
  signature?: string;
  /** Identity of the record creator */
  identity: string;
  /** Optional custom data payload */
  data?: {
    [key: string]: any;
  };
  /** Optional encrypted data */
  encrypted?: string;
  /** Optional collection grouping for the record */
  collection?: string;
}

/**
 * Represents a block in the blockchain
 */
/**
 * IBlock interface definition
 */
export interface IBlock {
  /** Array of records contained in this block */
  records: Array<IRecord>;
  /** Unix timestamp when the block was created */
  timestamp: number;
  /** Hash of the previous block in the chain */
  last_hash: string;
  /** Hash of this block (computed after mining) */
  hash?: string;
  /** Proof-of-work nonce value */
  nonce?: number;
}

/**
 * Represents the complete blockchain ledger
 */
/**
 * ILedger interface definition
 */
export interface ILedger {
  /** The blockchain - array of blocks */
  chain: Array<IBlock>;
  /** Records waiting to be mined into a block */
  pending_records: Array<IRecord>;
  /** Unique identifier for this ledger */
  id: string;
}

/**
 * Adds a record to the pending records queue of a ledger
 * @param record - The record to add to the pending queue
 * @param ledger - The target ledger to modify
 * @returns A new ledger instance with the record added to pending records
 */
export function addRecord(record: IRecord, ledger: ILedger): ILedger {
  return {
    ...ledger,
    pending_records: Array.from(new Set([...ledger.pending_records, record])),
  };
}

/**
 * Mines all pending records into a new block and adds it to the chain
 * @param ledger - The ledger containing pending records to mine
 * @param extra - Additional metadata to include in the block
 * @returns A promise that resolves to the updated ledger with mined block and cleared pending records
 */
export async function mine(ledger: ILedger, extra: Object): Promise<ILedger> {
  if (!ledger.pending_records?.length) {
    return ledger;
  }
  const lastBlock = ledger.chain[ledger.chain.length - 1];

  const newBlock = createBlock(ledger.pending_records, lastBlock.hash, extra);
  const proof = await hashData(newBlock);
  const mined = await addBlock(ledger, { ...newBlock }, proof);

  return {
    ...mined,
    pending_records: [],
  };
}

/**
 * Validates the integrity of a blockchain by checking hash linkage
 * @param chain - The blockchain to validate
 * @returns True if the chain is valid, false otherwise
 */
function isChainValid(chain: Array<IBlock>): boolean {
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];

    if (currentBlock.last_hash !== previousBlock.hash) {
      return false;
    }
  }
  return true;
}

/**
 * Adds a mined block to the ledger's chain
 * @param ledger - The target ledger
 * @param block - The block to add to the chain
 * @param proof - The computed hash proof for the block
 * @returns A new ledger instance with the block added, or the original ledger if validation fails
 */
function addBlock(ledger: ILedger, block: IBlock, proof: string): ILedger {
  const lastBlock = ledger.chain[ledger.chain.length - 1];

  if (lastBlock.hash !== block.last_hash) {
    return ledger;
  }

  return {
    ...ledger,
    chain: [
      ...ledger.chain,
      {
        ...block,
        hash: proof,
      },
    ],
    pending_records: [...ledger.pending_records],
  };
}

/**
 * Creates a new block with the specified records and metadata
 * @param records - Array of records to include in the block (defaults to empty array)
 * @param last_hash - Hash of the previous block (defaults to "0" for genesis)
 * @param extra - Additional block metadata to include
 * @returns A new block instance with current timestamp
 */
function createBlock(
  records: Array<IRecord> = [],
  last_hash: string = "0",
  extra: Object = {}
): IBlock {
  return {
    records,
    timestamp: Date.now(),
    last_hash,
    ...extra,
  };
}

/**
 * Creates the genesis (first) block for a new blockchain
 * @param record - The genesis record to include in the first block
 * @param extra - Additional metadata for the genesis block
 * @returns A promise that resolves to the genesis block with computed hash
 */
async function createGenesisBlock(
  record: IRecord,
  extra: Object = {}
): Promise<IBlock> {
  const hash = await hashData(record);
  const block = createBlock([record], "0");
  return {
    ...block,
    hash,
    ...extra,
  };
}

/**
 * Implements consensus algorithm to resolve conflicts between multiple ledgers
 * Returns the valid ledger with the longest chain
 * @param ledgers - Array of ledgers to compare for consensus
 * @returns The ledger with the longest valid chain
 */
export function consensus(ledgers: Array<ILedger>): ILedger {
  let longest = ledgers[0];

  ledgers.forEach((ledger) => {
    if (!isChainValid(ledger.chain)) {
      return;
    }
    if (ledger.chain.length > longest.chain.length) {
      longest = ledger;
    }
  });

  return longest;
}

/**
 * Creates a new blockchain ledger with a genesis block
 * @param record - The genesis record to initialize the blockchain with
 * @param extra - Additional metadata for the genesis block
 * @returns A promise that resolves to a new ledger with the genesis block
 */
export async function createLedger(
  record: IRecord,
  extra: Object = {}
): Promise<ILedger> {
  const genesisBlock = await createGenesisBlock(record, extra);

  return {
    pending_records: [],
    chain: [genesisBlock],
    id: genesisBlock.hash || "0",
  };
}
