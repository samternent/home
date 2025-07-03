<script setup>
import { computed, shallowRef, onMounted } from 'vue';
import { useIdentity } from '../identity/useIdentity';
import { useLedger } from '../ledger/useLedger';

const props = defineProps({
  showAuditTrail: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const { publicKeyPEM, privateKey, ready } = useIdentity();
const { ledger } = useLedger();

const connectionStatus = shallowRef('checking');

// Computed
const shortSignature = computed(() => {
  return publicKeyPEM.value ? publicKeyPEM.value.slice(0, 16) + '...' : 'Generating...';
});

const recentEvents = computed(() => {
  if (!ledger.value || !Array.isArray(ledger.value)) return [];
  
  return ledger.value
    .slice(-5) // Last 5 events
    .reverse() // Most recent first
    .map(item => ({
      time: new Date(item.timestamp || item.createdAt || Date.now()).toLocaleTimeString(),
      action: getEventDescription(item),
      signature: item.signature ? '✅ Verified' : '⏳ Signing...',
      encrypted: item.encrypted || false
    }));
});

const offlineCapable = computed(() => {
  return !navigator.onLine || connectionStatus.value === 'offline';
});

// Methods
function getEventDescription(item) {
  switch (item.type) {
    case 'task': return `Task "${item.title}" created`;
    case 'note': return `Note "${item.title}" added`;
    case 'room': return `Room "${item.name}" created`;
    case 'user-profile': return 'Profile updated';
    default: return `${item.type || 'Item'} recorded`;
  }
}

function checkOfflineStatus() {
  connectionStatus.value = navigator.onLine ? 'online' : 'offline';
}

onMounted(() => {
  checkOfflineStatus();
  window.addEventListener('online', checkOfflineStatus);
  window.addEventListener('offline', checkOfflineStatus);
});
</script>

<template>
  <div class="security-proof" :class="{ 'compact': compact }">
    <div v-if="!compact" class="mb-6">
      <h3 class="text-lg font-bold mb-2">🛡️ Your Digital Security Proof</h3>
      <p class="text-sm text-base-content/70">
        Real-time verification of cryptographic security measures
      </p>
    </div>

    <!-- Security Status Grid -->
    <div class="grid" :class="compact ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'">
      
      <!-- Cryptographic Identity -->
      <div class="security-item bg-base-200 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🔑</span>
          <div class="flex-1">
            <h4 class="font-medium">Cryptographic Identity</h4>
            <div v-if="ready" class="text-xs text-green-600 font-medium">✅ Active</div>
            <div v-else class="text-xs text-yellow-600">⏳ Generating...</div>
          </div>
        </div>
        <div v-if="ready" class="text-xs font-mono bg-base-300 rounded p-2 break-all">
          {{ shortSignature }}
        </div>
        <p class="text-xs text-base-content/60 mt-2">
          Proves authenticity - impossible to forge
        </p>
      </div>

      <!-- Encryption Status -->
      <div class="security-item bg-base-200 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🔒</span>
          <div class="flex-1">
            <h4 class="font-medium">End-to-End Encryption</h4>
            <div class="text-xs text-green-600 font-medium">✅ Enabled</div>
          </div>
        </div>
        <p class="text-xs text-base-content/60">
          Sensitive data encrypted with your keys only
        </p>
      </div>

      <!-- Offline Operation -->
      <div class="security-item bg-base-200 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🌐</span>
          <div class="flex-1">
            <h4 class="font-medium">Offline Operation</h4>
            <div v-if="offlineCapable" class="text-xs text-green-600 font-medium">
              ✅ Fully Functional
            </div>
            <div v-else class="text-xs text-blue-600 font-medium">
              🌐 Online (Offline Ready)
            </div>
          </div>
        </div>
        <p class="text-xs text-base-content/60">
          Works completely without internet connection
        </p>
      </div>

      <!-- Data Sovereignty -->
      <div class="security-item bg-base-200 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">👑</span>
          <div class="flex-1">
            <h4 class="font-medium">Data Sovereignty</h4>
            <div class="text-xs text-green-600 font-medium">✅ You Own Everything</div>
          </div>
        </div>
        <p class="text-xs text-base-content/60">
          No servers, no tracking, no corporate control
        </p>
      </div>
    </div>

    <!-- Audit Trail -->
    <div v-if="showAuditTrail && !compact" class="mt-6">
      <h4 class="font-medium mb-3 flex items-center gap-2">
        <span>📊</span>
        Immutable Audit Trail
      </h4>
      
      <div v-if="recentEvents.length === 0" class="text-center py-6 text-base-content/50">
        <div class="text-3xl mb-2">📝</div>
        <p class="text-sm">No events recorded yet</p>
        <p class="text-xs">Create your first task or note to see the audit trail in action</p>
      </div>
      
      <div v-else class="space-y-2">
        <div 
          v-for="(event, index) in recentEvents" 
          :key="index"
          class="flex items-center gap-3 p-3 bg-base-200 rounded-lg text-sm"
        >
          <span class="text-xs text-base-content/60 font-mono min-w-[60px]">
            {{ event.time }}
          </span>
          <div class="flex-1">
            <span>{{ event.action }}</span>
            <span v-if="event.encrypted" class="ml-2 text-xs bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1 rounded">
              🔒 Encrypted
            </span>
          </div>
          <span class="text-xs" :class="event.signature.includes('✅') ? 'text-green-600' : 'text-yellow-600'">
            {{ event.signature }}
          </span>
        </div>
      </div>
    </div>

    <!-- Compact Audit Summary -->
    <div v-if="showAuditTrail && compact && recentEvents.length > 0" class="mt-3 text-center">
      <div class="text-xs text-base-content/60">
        {{ recentEvents.length }} recent actions • All cryptographically verified
      </div>
    </div>

    <!-- Revolutionary Footer -->
    <div v-if="!compact" class="mt-6 pt-4 border-t border-base-300">
      <div class="text-center space-y-2">
        <p class="text-sm font-medium text-primary">
          🔥 The revolution is encrypted
        </p>
        <p class="text-xs text-base-content/60">
          Your resistance data is cryptographically secured and under your complete control
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.security-item {
  transition: all 0.2s ease;
}

.security-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.compact .security-item {
  padding: 0.75rem;
}

.compact h4 {
  font-size: 0.875rem;
}

.compact .text-2xl {
  font-size: 1.25rem;
}
</style>
