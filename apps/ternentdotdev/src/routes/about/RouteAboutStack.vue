<script setup>
import { onMounted, shallowRef } from "vue";
import { SBrandHeader } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/about/stack",
  name: "Stack",
});

const costsData = shallowRef();

onMounted(async () => {
  const resp = await fetch("https://api.ternent.dev/my-costs");
  costsData.value = await resp.json();
});

const months = [
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
];
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <SBrandHeader class="font-light">Technology</SBrandHeader>
    <p class="my-2 mx-1 text-lg">
      Ternent.dev is built on our own open-source infrastructure.
    </p>
    <p class="my-2 mx-1 text-lg">
      We use node.js on the backend, where all services are deployed to our
      Kubernetes cluster, managed through Digital Ocean.
    </p>
    <p class="my-2 mx-1 text-lg">
      Front frontend development, we use VueJS and have our own design system
      using Tailwind and DaisyUI.
    </p>
    <SBrandHeader size="md" class="my-4 font-light">Our costs</SBrandHeader>
    <table class="w-full">
      <thead>
        <tr class="text-left">
          <th class="w-1/2">Date</th>
          <th class="w-1/4">Digital Ocean</th>
          <th class="w-1/4">Goat analytics</th>
          <th class="w-1/4">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="costsData?.history">
          <tr v-for="item in costsData?.history" :key="item.id">
            <td>
              {{
                `${months[new Date(item.date).getMonth()]} ${new Date(
                  item.date
                ).getFullYear()}`
              }}
            </td>
            <td>{{ item.amount.replace("", "$") }}</td>
            <td>$3</td>
            <td>${{ (Number(item.amount) + 3).toFixed(2) }}</td>
          </tr>
        </template>
        <template v-else>
          <tr v-for="i in 10" :key="i" class="h-8">
            <td><div class="skeleton rounded mt-1 h-6" /></td>
            <td><div class="skeleton rounded mt-1 h-6" /></td>
            <td><div class="skeleton rounded mt-1 h-6" /></td>
            <td><div class="skeleton rounded mt-1 h-6" /></td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
