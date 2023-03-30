<script setup>
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import { Ledger } from "@/modules/ledger";
import { Solid } from "@/modules/solid";
</script>

<template>
  <Encryption>
    <Identity>
      <Ledger>
        <Solid>
          <slot />
        </Solid>
      </Ledger>
    </Identity>
  </Encryption>
</template>
