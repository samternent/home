<script setup>
import { shallowRef } from "vue";
import { LedgerPeoplePicker } from "@/modules/ledger";

const password = shallowRef(null);
const title = shallowRef(null);
const show1 = shallowRef(false);
const rules = shallowRef({
  required: (value) => !!value || "Required.",
  min: (v) => v.length >= 8 || "Min 8 characters",
  emailMatch: () => `The email and password you entered don't match`,
});
</script>
<template>
  <v-card class="max-w-3xl mx-auto w-96 bg-gray-100 py-4">
    <v-card-title class="text-h5"> Add permission </v-card-title>
    <v-card-text>
      <v-responsive class="mx-auto" max-width="344">
        <v-text-field
          v-model="title"
          type="text"
          name="input-10-1"
          label="Permission Name"
        ></v-text-field>
      </v-responsive>
      <v-responsive class="mx-auto" max-width="344">
        <LedgerPeoplePicker />
      </v-responsive>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="green-darken-1" variant="text" @click="$emit('close')">
        Disagree
      </v-btn>
      <v-btn
        color="green-darken-1"
        variant="text"
        @click="() => $emit('create', title, password)"
      >
        Agree
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
