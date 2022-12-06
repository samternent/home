import { hashData } from "@concords/utils";

async function proofOfWork(block, difficulty) {
  let nonce = 0;
  const findHash = async (block) => {
    let hash = await hashData(block);
    if (hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      nonce = nonce + 1;
      hash = await findHash({
        ...block,
        nonce,
      });
    }
    return hash;
  };
  const hash = await findHash(block);

  return { proof: hash, nonce };
}

export async function isValidProof(block, hash, difficulty) {
  const blockHash = await hashData(block);
  return (
    hash.substring(0, difficulty) === Array(difficulty + 1).join("0") &&
    hash === blockHash
  );
}

export function addRecord(record, ledger) {
  return {
    ...ledger,
    pending_records: Array.from(new Set([...ledger.pending_records, record])),
  };
}

export async function mine(ledger, extra) {
  if (!ledger.pending_records.length) {
    return ledger;
  }
  const lastBlock = ledger.chain[ledger.chain.length - 1];

  const newBlock = createBlock(ledger.pending_records, lastBlock.hash, extra);
  const { proof, nonce } = await proofOfWork(newBlock, ledger.difficulty);
  const mined = await addBlock(ledger, { ...newBlock, nonce }, proof);

  return {
    ...mined,
    pending_records: [],
  };
}

function isChainValid(chain) {
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];

    if (currentBlock.last_hash !== previousBlock.hash) {
      return false;
    }
  }
  return true;
}

async function addBlock(ledger, block, proof) {
  const lastBlock = ledger.chain[ledger.chain.length - 1];

  if (lastBlock.hash !== block.last_hash) {
    return ledger;
  }

  if (!isValidProof(block, proof, ledger.difficulty)) {
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

function createBlock(records = [], last_hash = "0", extra = {}) {
  return {
    records,
    timestamp: Date.now(),
    last_hash,
    ...extra,
  };
}

async function createGenesisBlock(record) {
  const timestamp = Date.now();
  const hash = await hashData({ ...record, timestamp });
  const block = createBlock([
    {
      ...record,
      timestamp,
      id: hash,
    },
  ]);
  return {
    ...block,
    hash,
  };
}

export function consensus(ledgers) {
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

export async function createLedger(record, difficulty) {
  const genesisBlock = await createGenesisBlock(record);

  return {
    difficulty,
    pending_records: [],
    chain: [genesisBlock],
    id: genesisBlock.hash,
  };
}
