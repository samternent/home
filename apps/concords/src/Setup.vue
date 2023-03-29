<script setup>
import { provideCurrentUser } from "@/api/useCurrentUser";
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import { Solid } from "@/modules/solid";

const { ready } = provideCurrentUser();
</script>

<template>
  <Encryption>
    <Identity>
      <Solid>
        <slot />
      </Solid>
    </Identity>
  </Encryption>
</template>
