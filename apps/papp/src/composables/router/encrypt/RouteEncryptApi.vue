<script setup lang="ts"></script>
<template>
  <div class="flex-col">
    <header class="mt-4 mb-8 ml-6">
      <h1 class="text-3xl font-light">API</h1>
    </header>
    <div class="p-4">
      <h2>Generate Age Keys</h2>
      <code>
        import { generate } from "@concords/encrypt"; const [publicKey,
        privateKey] = await generate();
      </code>
      <h2>Encrypt</h2>
      <code>
        import { encrypt } from "@concords/encrypt"; const encryptedText = await
        encrypt('password || age public key', 'text to encrypt'); const
        jsonToEncrypt = { hello: 'World!', } const encryptedData = await
        encrypt('password || age public key', JSON.stringify(jsonToEncrypt));
      </code>
      <h2>Decrypt</h2>
      <code>
        import { decrypt } from "@concords/encrypt"; const secretText = await
        decrypt('password || age private key', encryptedText); const secretData
        = JSON.parse(await encrypt('password || age public key',
        encryptedData));
      </code>
    </div>
  </div>
</template>
