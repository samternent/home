```
<script setup>
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import { provideSolid } from "@/modules/solid";

provideSolid();
</script>

<template>
  <Solid>
    <Identity>
      <Encryption>
        <RouterView />
      </Encryption>
    </Identity>
  </Solid>
</template>
```
