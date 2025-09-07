<script setup>
import { ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { onClickOutside } from "@vueuse/core";
import {
  SNavBar,
  SBreadcrumbs,
  SButton,
} from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { useIdentity } from "@/module/identity/useIdentity";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

const { publicKeyPEM } = useIdentity();
const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);

const breadcrumbs = useBreadcrumbs();

// Close user menu when clicking outside
onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false;
});

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};

const userMenuItems = [
  {
    label: "View Profile",
    description: "Identity & keys overview",
    icon: "👤",
    to: "/app/profile",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    label: "Manage Profile", 
    description: "Edit, share & backup",
    icon: "👥",
    to: "/app/profile/management",
    gradient: "from-green-500 to-green-600"
  },
  {
    label: "Settings",
    description: "App preferences",
    icon: "⚙️",
    to: "/app/settings",
    gradient: "from-slate-500 to-slate-600"
  },
  {
    label: "Solid Pod",
    description: "Connect & sync",
    icon: "🌐",
    to: "/solid",
    gradient: "from-purple-500 to-purple-600"
  },
];
</script>
<template>
  <SNavBar variant="glass">
    <!-- Mobile menu toggle -->
    <template #nav>
      <SButton
        variant="ghost-icon"
        size="micro"
        @click="openSideBar = !openSideBar"
        class="stripe-mobile-toggle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </SButton>
    </template>

    <!-- Breadcrumbs -->
    <template #start>
      <div class="flex items-center">
        <!-- Breadcrumbs with enhanced styling -->
        <SBreadcrumbs
          :breadcrumbs="breadcrumbs"
          size="micro"
          class="stripe-breadcrumbs"
        />
      </div>
    </template>

    <!-- User menu -->
    <template #end>
      <div class="relative" ref="userMenuRef">
        <!-- Compact user avatar button -->
        <button
          @click="toggleUserMenu"
          class="user-avatar"
          :class="{ active: userMenuOpen }"
        >
          <IdentityAvatar
            :identity="publicKeyPEM"
            size="sm"
            class="avatar-identity"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-3 h-3 ml-1 transition-transform"
            :class="{ 'rotate-180': userMenuOpen }"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        <!-- Enhanced dropdown menu -->
        <div v-if="userMenuOpen" class="user-dropdown">
          <!-- Header with identity info -->
          <div class="dropdown-header">
            <IdentityAvatar
              :identity="publicKeyPEM"
              size="md"
              class="header-avatar"
            />
            <div class="header-info">
              <div class="header-title">Your Identity</div>
              <div class="header-subtitle">Cryptographic Profile</div>
            </div>
          </div>

          <!-- Menu items -->
          <div class="dropdown-items">
            <RouterLink
              v-for="item in userMenuItems"
              :key="item.to"
              :to="item.to"
              class="dropdown-item"
              @click="userMenuOpen = false"
            >
              <div class="item-icon-wrapper" :class="`bg-gradient-to-br ${item.gradient}`">
                <span class="item-emoji">{{ item.icon }}</span>
              </div>
              <div class="item-content">
                <div class="item-label">{{ item.label }}</div>
                <div class="item-description">{{ item.description }}</div>
              </div>
              <svg
                class="item-arrow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </RouterLink>
          </div>
        </div>
      </div>
    </template>
  </SNavBar>
</template>

<style scoped>
/* Logo styling */
.stripe-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  background: oklch(var(--p) / 0.1);
  text-decoration: none;
  transition: background 0.15s ease;
}

.stripe-logo:hover {
  background: oklch(var(--p) / 0.15);
}

/* User menu */
.user-avatar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.user-avatar:hover {
  background: oklch(var(--b2) / 0.5);
  border-color: oklch(var(--b3));
}

.avatar-identity {
  border-radius: 50%;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  width: 20rem;
  background: oklch(var(--b1) / 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid oklch(var(--b3));
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px oklch(var(--bc) / 0.1);
  z-index: 50;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid oklch(var(--b3));
  background: oklch(var(--b2) / 0.5);
}

.header-avatar {
  border: 2px solid oklch(var(--p) / 0.2);
  border-radius: 50%;
}

.header-info {
  flex: 1;
}

.header-title {
  font-weight: 600;
  color: oklch(var(--bc));
  font-size: 0.875rem;
}

.header-subtitle {
  font-size: 0.75rem;
  color: oklch(var(--bc) / 0.6);
  margin-top: 0.125rem;
}

.dropdown-items {
  padding: 0.5rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: oklch(var(--b2));
}

.item-icon-wrapper {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.dropdown-item:hover .item-icon-wrapper {
  transform: scale(1.05);
}

.item-emoji {
  font-size: 1rem;
}

.item-content {
  flex: 1;
}

.item-label {
  font-weight: 500;
  color: oklch(var(--bc));
  font-size: 0.875rem;
}

.item-description {
  font-size: 0.75rem;
  color: oklch(var(--bc) / 0.6);
  margin-top: 0.125rem;
}

.item-arrow {
  width: 1rem;
  height: 1rem;
  color: oklch(var(--bc) / 0.4);
  opacity: 0;
  transform: translateX(-0.25rem);
  transition: all 0.15s ease;
}

.dropdown-item:hover .item-arrow {
  opacity: 1;
  transform: translateX(0);
  color: oklch(var(--p));
}
</style>
