<script setup>
import { provideCurrentUser } from "@/api/useCurrentUser";
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import { Ledger } from "@/modules/Ledger";
import { Solid } from "@/modules/solid";

const { ready } = provideCurrentUser();
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
