<script setup lang="ts">
import Concord from "../concord/Concord.vue";
import DemoIdentity from "./DemoIdentity.vue";
import DemoEncryption from "./DemoEncryption.vue";
import DemoCreateLedger from "./DemoCreateLedger.vue";
import AppLayout from "../app/AppLayout.vue";
import Console from "../console/Console.vue";
</script>
<template>
  <Concord>
    <AppLayout>
      <DemoIdentity />
      <DemoEncryption />

      <template #console="{ container }">
        <Console :container>
          <template #panel-control> </template>
          <DemoCreateLedger />
        </Console>
      </template>
    </AppLayout>
  </Concord>
</template>
