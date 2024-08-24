<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
</script>
<template>
  <div class="flex-1 p-4 bg-base-100">
    <h2>Apps</h2>
    <ul>
      <li>
        <RouterLink to="/changelogs/apps/ternentdotdev"
          >ternentdotdev</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelogs/apps/ternent-api">ternent-api</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelogs/apps/footballsocial"
          >footabllsocial</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelogs/apps/footballsocial-api"
          >footabllsocial-api</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelogs/apps/concords">concords</RouterLink>
      </li>
    </ul>
    <h2>Packages</h2>
    <ul>
      <li>
        <RouterLink to="/changelogs/packages/encrypt">encrypt</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelogs/packages/game-kit">game-kit</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelogs/packages/identity">identity</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelogs/packages/ledger">ledger</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelogs/packages/proof-of-work"
          >proof-of-work</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/changelogs/packages/ragejs">ragejs</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelogs/packages/ternent-ui">ternent-ui</RouterLink>
      </li>
      <li>
        <RouterLink to="/changelogs/packages/utils">utils</RouterLink>
      </li>
    </ul>
  </div>
</template>
