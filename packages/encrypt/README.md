# Concords Encrypt

A TypeScript encryption library built on top of the Rust [age](https://github.com/str4d/age) encryption tool with web worker support for asynchronous operations.

## Features

- **Local WASM**: Uses a custom-built WASM package instead of external dependencies
- **X25519 encryption**: Public key encryption using age X25519 keys
- **Passphrase encryption**: Password-based encryption
- **Async support**: Web worker integration for non-blocking encryption operations
- **TypeScript**: Full TypeScript support with type definitions
- **Browser ready**: Works in modern browsers with WASM support

- ✅ **Age Encryption Standard**:  Modern, secure encryption using the age format
- ✅ **Dual Encryption Methods**:  Support for both public key and passphrase encryption
- ✅ **Automatic Detection**:  Automatically chooses encryption method based on key format
- ✅ **Key Generation**:  Generate X25519 key pairs for public key encryption
- ✅ **WebAssembly Performance**:  Built on rage-wasm for optimal performance
- ✅ **TypeScript Support**:  Full TypeScript definitions included
- ✅ **Armored Output**:  Human-readable armored format for encrypted data

## Installation

```bash
npm install @your-org/encrypt
```

## Quick Start

```typescript
import { generate, encrypt, decrypt } from '@your-org/encrypt';

// Example usage
// TODO: Add specific examples for encrypt
```

## API Reference

### Functions

#### `generate()`
// TODO: Add documentation for generate

#### `encrypt()`
// TODO: Add documentation for encrypt

#### `decrypt()`
// TODO: Add documentation for decrypt



## Usage Examples

### Basic Example

```typescript
// TODO: Add comprehensive examples for encrypt
```

## Dependencies

See `package.json` for current dependencies.



## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests with `npm test`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
