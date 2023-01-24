<script lang="ts" setup>
import { shallowRef, computed } from "vue";

const tableName = shallowRef<string>("");
</script>
<template>
  <div>
    <FormKit type="text" v-model="tableName" placeholder="Table Name" />
    <table class="border" v-if="tableName">
      <thead>
        <tr>
          <th
            colspan="2"
            class="px-5 py-3 border-b-2 border-gray-800 text-left text-xs font-semibold uppercase tracking-wider"
          >
            {{ tableName.split(" ").join("_") }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="px-5 py-1 border-b border-gray-800 text-sm"></td>
          <td class="px-5 py-1 border-b border-gray-800 text-sm"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
