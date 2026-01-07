<script setup>
import { SCard } from "ternent-ui/components";
</script>
<template>
  <div class="flex-1 p-micro bg-background">
    <SCard class="mb-micro">
      <h2 class="gradient-heading text-heading-md mb-micro">Apps</h2>
      <ul class="space-y-1">
        <li>
          <RouterLink to="/readme/apps/ternentdotdev" class="link text-body-md hover:text-accent transition-colors">ternentdotdev</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/apps/ternent-api" class="link text-body-md hover:text-accent transition-colors">ternent-api</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/apps/footballsocial" class="link text-body-md hover:text-accent transition-colors">footballsocial</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/apps/footballsocial-api" class="link text-body-md hover:text-accent transition-colors">footballsocial-api</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/apps/concords" class="link text-body-md hover:text-accent transition-colors">concords</RouterLink>
        </li>
      </ul>
    </SCard>
    
    <SCard>
      <h2 class="gradient-heading text-heading-md mb-micro">Packages</h2>
      <ul class="space-y-1">
        <li>
          <RouterLink to="/readme/packages/encrypt" class="link text-body-md hover:text-accent transition-colors">encrypt</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/packages/game-kit" class="link text-body-md hover:text-accent transition-colors">game-kit</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/packages/identity" class="link text-body-md hover:text-accent transition-colors">identity</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/packages/ledger" class="link text-body-md hover:text-accent transition-colors">ledger</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/packages/concord-protocol" class="link text-body-md hover:text-accent transition-colors">concord-protocol</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/packages/ragejs" class="link text-body-md hover:text-accent transition-colors">ragejs</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/packages/ternent-ui" class="link text-body-md hover:text-accent transition-colors">ternent-ui</RouterLink>
        </li>
        <li>
          <RouterLink to="/readme/packages/utils" class="link text-body-md hover:text-accent transition-colors">utils</RouterLink>
        </li>
      </ul>
    </SCard>
  </div>
</template>
