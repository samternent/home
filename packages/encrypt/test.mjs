// Simple test script to verify the new encryption package works
import { generate, encrypt, decrypt } from './dist/encrypt.es.js';

async function testBasicEncryption() {
  console.log('🧪 Testing basic encryption functionality...');
  
  try {
    // Test key generation
    const [privateKey, publicKey] = await generate();
    console.log('✅ Key generation successful');
    console.log(`   Private key: ${privateKey.slice(0, 20)}...`);
    console.log(`   Public key: ${publicKey.slice(0, 20)}...`);
    
    // Test message encryption/decryption
    const message = "Hello, secure world!";
    console.log(`📝 Original message: "${message}"`);
    
    const encrypted = await encrypt(publicKey, message);
    console.log('✅ Encryption successful');
    console.log(`   Encrypted length: ${encrypted.length} chars`);
    
    const decrypted = await decrypt(privateKey, encrypted);
    console.log('✅ Decryption successful');
    console.log(`   Decrypted message: "${decrypted}"`);
    
    if (decrypted === message) {
      console.log('✅ Round-trip test PASSED');
    } else {
      console.log('❌ Round-trip test FAILED');
    }
    
    // Test passphrase encryption
    const password = "my-secure-password";
    const passphraseEncrypted = await encrypt(password, message);
    const passphraseDecrypted = await decrypt(password, passphraseEncrypted);
    
    if (passphraseDecrypted === message) {
      console.log('✅ Passphrase encryption test PASSED');
    } else {
      console.log('❌ Passphrase encryption test FAILED');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function testAsyncAPI() {
  console.log('\n🔄 Testing async API (all functions are now async)...');
  
  try {
    // Test async key generation
    const [privateKey, publicKey] = await generate();
    console.log('✅ Key generation successful');
    
    const message = "Hello from async API!";
    
    const encrypted = await encrypt(publicKey, message);
    console.log('✅ Encryption successful');
    
    const decrypted = await decrypt(privateKey, encrypted);
    console.log('✅ Decryption successful');
    
    if (decrypted === message) {
      console.log('✅ Round-trip test PASSED');
    } else {
      console.log('❌ Round-trip test FAILED');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting encryption tests...\n');
  
  await testBasicEncryption();
  await testAsyncAPI();
  
  console.log('\n✨ Tests completed!');
}

runTests().catch(console.error);
