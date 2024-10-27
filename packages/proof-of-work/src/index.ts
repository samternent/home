import { hashData } from "concords-utils";

export interface IProof {
  proof: string;
  nonce: number;
}

export interface IRecord {
  id: string;
  timestamp: number;
  signature?: string;
  identity: string;
  data?: {
    [key: string]: any;
  };
  encrypted?: string;
  collection?: string;
}

export interface IBlock {
  records: Array<IRecord>;
  timestamp: number;
  last_hash: string;
  hash?: string;
  nonce?: number;
}

export interface ILedger {
  chain: Array<IBlock>;
  pending_records: Array<IRecord>;
  id: string;
}

export function addRecord(record: IRecord, ledger: ILedger): ILedger {
  return {
    ...ledger,
    pending_records: Array.from(new Set([...ledger.pending_records, record])),
  };
}

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
