<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { compress, decompress } from "@/utils/compress";
import { ILedger } from "@concords/proof-of-work";
import { b64encode } from "@concords/utils";

const { ledger } = useLedger();

const size = shallowRef(0);
const compressedSize = shallowRef(0);
watch(ledger, async (_ledger: ILedger) => {
  size.value = new TextEncoder().encode(JSON.stringify(_ledger)).length;
  const { buffer } = await compress(_ledger);
  console.log(await decompress(b64encode(buffer)));
  compressedSize.value = b64encode(buffer).length;
});
const sizeInKb = computed(() => size.value / 1024);
const sizeInMb = computed(() => sizeInKb.value / 1024);

const compressedSizeInKb = computed(() => compressedSize.value / 1024);
const compressedSizeInMb = computed(() => compressedSizeInKb.value / 1024);
</script>
<template>
  <div v-if="ledger" class="flex h-full flex-1 items-center justify-between">
    <div
      class="px-2.5 py-0.5 bg-pink-600 text-white rounded-full text-xs font-medium"
    >
      {{ ledger.pending_records.length }}
    </div>
    <div class="px-4 text-sm text-zinc-100">
      {{
        sizeInMb > 1
          ? `${Math.round((sizeInMb + Number.EPSILON) * 100) / 100}MB`
          : `${Math.floor(sizeInKb)}KB`
      }}
      <!-- /
      {{
        compressedSizeInMb > 1
          ? `${Math.round((compressedSizeInMb + Number.EPSILON) * 100) / 100}MB`
          : `${Math.floor(compressedSizeInKb)}KB`
      }} -->
    </div>
  </div>
</template>
