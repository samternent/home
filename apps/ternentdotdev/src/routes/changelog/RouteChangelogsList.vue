<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
</script>
<template>
  <div class="flex-1 p-4 bg-base-100">
    <h2>Apps</h2>
    <ul>
      <li>
        <RouterLink to="/changelog/apps/ternentdotdev"
          >ternentdotdev</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelog/apps/ternent-api">ternent-api</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelog/apps/footballsocial"
          >footabllsocial</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelog/apps/footballsocial-api"
          >footabllsocial-api</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelog/apps/concords">concords</RouterLink>
      </li>
    </ul>
    <h2>Packages</h2>
    <ul>
      <li>
        <RouterLink to="/changelog/packages/encrypt">encrypt</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelog/packages/game-kit">game-kit</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelog/packages/identity">identity</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelog/packages/ledger">ledger</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelog/packages/proof-of-work"
          >proof-of-work</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelog/packages/ragejs">ragejs</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelog/packages/ternent-ui">ternent-ui</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelog/packages/utils">utils</RouterLink>
      </li>
    </ul>
  </div>
</template>
