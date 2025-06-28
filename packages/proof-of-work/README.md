# Proof of Work Package

A TypeScript implementation of a blockchain ledger system with proof-of-work mining capabilities.

## Overview

This package provides a complete blockchain ledger system that includes:

- Record management with digital signatures
- Block creation and mining with proof-of-work
- Chain validation and consensus mechanisms
- Encrypted data storage support

## Features

- ✅ **Blockchain Ledger**: Create and manage a chain of blocks containing records
- ✅ **Proof of Work Mining**: Mine blocks using cryptographic hashing
- ✅ **Record Management**: Add records with timestamps, signatures, and optional encryption
- ✅ **Chain Validation**: Verify the integrity of the blockchain
- ✅ **Consensus Algorithm**: Resolve conflicts between multiple ledgers
- ✅ **Flexible Data Storage**: Support for custom data structures and collections

## Installation

```bash
npm install @your-org/proof-of-work
```

## Quick Start

```typescript
import {
  createLedger,
  addRecord,
  mine,
  IRecord,
} from "@your-org/proof-of-work";

// Create a genesis record
const genesisRecord: IRecord = {
  id: "genesis",
  timestamp: Date.now(),
  identity: "system",
  data: { message: "Genesis block" },
};

// Create a new ledger
const ledger = await createLedger(genesisRecord);

// Add a new record
const newRecord: IRecord = {
  id: "record-1",
  timestamp: Date.now(),
  identity: "user-123",
  data: { action: "transfer", amount: 100 },
};

const updatedLedger = addRecord(newRecord, ledger);

// Mine the pending records
const minedLedger = await mine(updatedLedger, { difficulty: 4 });

console.log("Blockchain created with", minedLedger.chain.length, "blocks");
```

## API Reference

### Interfaces

#### `IRecord`

Represents a single record in the blockchain.

```typescript
interface IRecord {
  id: string; // Unique identifier
  timestamp: number; // Unix timestamp
  signature?: string; // Digital signature
  identity: string; // Creator identity
  data?: {
    // Custom data payload
    [key: string]: any;
  };
  encrypted?: string; // Encrypted data
  collection?: string; // Optional collection grouping
}
```

#### `IBlock`

Represents a block in the blockchain.

```typescript
interface IBlock {
  records: Array<IRecord>; // Records contained in the block
  timestamp: number; // Block creation timestamp
  last_hash: string; // Hash of the previous block
  hash?: string; // This block's hash
  nonce?: number; // Proof-of-work nonce
}
```

#### `ILedger`

Represents the complete blockchain ledger.

```typescript
interface ILedger {
  chain: Array<IBlock>; // The blockchain
  pending_records: Array<IRecord>; // Records waiting to be mined
  id: string; // Ledger identifier
}
```

#### `IProof`

Represents proof-of-work result.

```typescript
interface IProof {
  proof: string; // The computed hash proof
  nonce: number; // The nonce that produced the proof
}
```

### Functions

#### `createLedger(record: IRecord, extra?: Object): Promise<ILedger>`

Creates a new blockchain ledger with a genesis block.

**Parameters:**

- `record`: The genesis record
- `extra`: Optional additional block data

**Returns:** Promise resolving to a new ledger

#### `addRecord(record: IRecord, ledger: ILedger): ILedger`

Adds a record to the pending records queue.

**Parameters:**

- `record`: The record to add
- `ledger`: The target ledger

**Returns:** Updated ledger with the new pending record

#### `mine(ledger: ILedger, extra: Object): Promise<ILedger>`

Mines all pending records into a new block.

**Parameters:**

- `ledger`: The ledger to mine
- `extra`: Additional block metadata (e.g., difficulty)

**Returns:** Promise resolving to the updated ledger with mined block

#### `consensus(ledgers: Array<ILedger>): ILedger`

Implements consensus algorithm to resolve conflicts between multiple ledgers.

**Parameters:**

- `ledgers`: Array of ledgers to compare

**Returns:** The valid ledger with the longest chain

## Usage Examples

### Creating Records with Signatures

```typescript
const signedRecord: IRecord = {
  id: "signed-record-1",
  timestamp: Date.now(),
  identity: "user-456",
  signature: "digital-signature-here",
  data: {
    transaction: "payment",
    amount: 250,
    recipient: "user-789",
  },
};
```

### Working with Collections

```typescript
const collectionRecord: IRecord = {
  id: "doc-1",
  timestamp: Date.now(),
  identity: "author-123",
  collection: "documents",
  data: {
    title: "Important Document",
    content: "Document content here",
  },
};
```

### Mining with Custom Difficulty

```typescript
const minedLedger = await mine(ledger, {
  difficulty: 6,
  minerReward: 50,
  minerId: "miner-node-1",
});
```

### Consensus Resolution

```typescript
const ledger1 = await createLedger(record1);
const ledger2 = await createLedger(record2);
const ledger3 = await createLedger(record3);

// Add more blocks to different ledgers...

const validLedger = consensus([ledger1, ledger2, ledger3]);
console.log(
  "Consensus reached, valid chain has",
  validLedger.chain.length,
  "blocks"
);
```

## Security Considerations

- **Digital Signatures**: Always include signatures for important records
- **Data Encryption**: Use the `encrypted` field for sensitive data
- **Chain Validation**: The system automatically validates chain integrity
- **Consensus**: Use consensus mechanism when working with distributed ledgers

## Dependencies

This package requires:

- `concords-utils` for cryptographic hashing functions

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
