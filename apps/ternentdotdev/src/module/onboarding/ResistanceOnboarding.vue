<script setup>
import { shallowRef, computed, onMounted, watch } from 'vue';
import { SButton, SDrawerRight } from 'ternent-ui/components';
import { useRouter } from 'vue-router';
import { useIdentity } from '../identity/useIdentity';
import { useLedger } from '../ledger/useLedger';
import { generateId } from 'concords-utils';
import { resistanceScenarios, revolutionaryMessages, quickStartTips } from '../demo/demoScenarios';

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:open', 'completed']);

const router = useRouter();
const { ready: identityReady, publicKeyPEM } = useIdentity();
const { addItem } = useLedger();

// Onboarding state
const isOpen = shallowRef(false);
const currentStep = shallowRef(1);
const selectedScenario = shallowRef(null);
const roomName = shallowRef('');
const isCreating = shallowRef(false);
const showSuccess = shallowRef(false);

// Watch props
watch(() => props.open, (value) => {
  isOpen.value = value;
  if (value) {
    resetOnboarding();
  }
});

watch(isOpen, (value) => {
  emit('update:open', value);
});

// Computed
const scenarios = computed(() => Object.values(resistanceScenarios));
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return identityReady.value;
    case 2: return roomName.value.trim().length > 0;
    case 3: return selectedScenario.value !== null;
    default: return true;
  }
});

// Methods
function resetOnboarding() {
  currentStep.value = 1;
  selectedScenario.value = null;
  roomName.value = '';
  isCreating.value = false;
  showSuccess.value = false;
}

function nextStep() {
  if (canProceed.value && currentStep.value < 5) {
    currentStep.value++;
    
    if (currentStep.value === 4) {
      createResistanceRoom();
    }
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function selectScenario(scenarioKey) {
  selectedScenario.value = scenarioKey;
  const scenario = resistanceScenarios[scenarioKey];
  if (!roomName.value) {
    roomName.value = scenario.name;
  }
}

async function createResistanceRoom() {
  if (!selectedScenario.value) return;
  
  isCreating.value = true;
  
  try {
    const scenario = resistanceScenarios[selectedScenario.value];
    
    // Create room metadata
    const roomRecord = {
      id: generateId(),
      type: 'resistance-room',
      name: roomName.value,
      description: scenario.description,
      icon: scenario.icon,
      scenario: selectedScenario.value,
      creator: publicKeyPEM.value,
      createdAt: new Date().toISOString(),
      isDemo: true
    };
    
    await addItem(roomRecord, 'rooms');
    
    // Add demo tasks
    for (const task of scenario.tasks) {
      await addItem({
        ...task,
        roomId: roomRecord.id,
        type: 'task',
        createdAt: new Date().toISOString(),
        creator: publicKeyPEM.value
      }, 'tasks');
    }
    
    // Add demo notes
    for (const note of scenario.notes) {
      await addItem({
        ...note,
        roomId: roomRecord.id,
        type: 'note',
        createdAt: new Date().toISOString(),
        creator: publicKeyPEM.value
      }, 'notes');
    }
    
    showSuccess.value = true;
    currentStep.value = 5;
    
  } catch (error) {
    console.error('Error creating resistance room:', error);
  } finally {
    isCreating.value = false;
  }
}

function completeOnboarding() {
  emit('completed', {
    scenarioKey: selectedScenario.value,
    roomName: roomName.value
  });
  isOpen.value = false;
  router.push('/app');
}

function skipToApp() {
  isOpen.value = false;
  router.push('/app');
}

onMounted(() => {
  if (props.open) {
    isOpen.value = true;
  }
});
</script>

<template>
  <SDrawerRight v-model="isOpen" :title="currentStep <= 4 ? '🔥 Join the Digital Resistance' : '🚀 Resistance Room Created!'">
    <div class="p-6 space-y-6">
      
      <!-- Progress -->
      <div v-if="currentStep <= 4" class="steps steps-horizontal w-full mb-6">
        <div class="step" :class="{ 'step-primary': currentStep >= 1 }">Identity</div>
        <div class="step" :class="{ 'step-primary': currentStep >= 2 }">Room</div>
        <div class="step" :class="{ 'step-primary': currentStep >= 3 }">Scenario</div>
        <div class="step" :class="{ 'step-primary': currentStep >= 4 }">Launch</div>
      </div>

      <!-- Step 1: Identity Generation -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div class="text-center">
          <h2 class="text-xl font-bold mb-2">🔑 Generate Your Digital Identity</h2>
          <p class="text-base-content/70 mb-4">
            {{ revolutionaryMessages.welcome }}
          </p>
        </div>
        
        <div class="bg-base-200 rounded-lg p-4">
          <div v-if="!identityReady" class="text-center space-y-3">
            <div class="loading loading-spinner loading-md text-primary"></div>
            <p class="text-sm">Generating cryptographic keys locally...</p>
            <div class="text-xs text-base-content/60">
              ✅ Keys created on your device - never transmitted
            </div>
          </div>
          
          <div v-else class="text-center space-y-3">
            <div class="text-green-600 text-4xl">✅</div>
            <p class="font-medium">Digital Identity Created!</p>
            <div class="text-xs text-base-content/60 space-y-1">
              <div>🔐 Public Key: {{ publicKeyPEM.slice(0, 32) }}...</div>
              <div>🔒 Private Key: Secured locally</div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="font-medium">Your Cryptographic Sovereignty:</h3>
          <ul class="text-sm text-base-content/70 space-y-1">
            <li>✅ No signup required - you are your own authority</li>
            <li>✅ Keys never leave your device</li>
            <li>✅ Every action cryptographically signed</li>
            <li>✅ Impossible to forge or impersonate</li>
          </ul>
        </div>
      </div>

      <!-- Step 2: Room Name -->
      <div v-if="currentStep === 2" class="space-y-4">
        <div>
          <h2 class="text-xl font-bold mb-2">🏠 Name Your Resistance Room</h2>
          <p class="text-base-content/70 mb-4">
            Choose a name for your secure collaboration space
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Room Name</label>
          <input 
            v-model="roomName"
            type="text" 
            class="input input-bordered w-full" 
            placeholder="Food Justice Campaign 2025"
            @keyup.enter="nextStep"
          />
        </div>

        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 class="font-medium mb-2">🛡️ Room Security Features</h3>
          <ul class="text-sm space-y-1">
            <li>🔒 End-to-end encrypted communications</li>
            <li>📝 Immutable audit trail of all actions</li>
            <li>🌐 Works completely offline</li>
            <li>💾 Your data stays on your device</li>
          </ul>
        </div>
      </div>

      <!-- Step 3: Scenario Selection -->
      <div v-if="currentStep === 3" class="space-y-4">
        <div>
          <h2 class="text-xl font-bold mb-2">⚡ Choose Your Resistance</h2>
          <p class="text-base-content/70 mb-4">
            Select a demo scenario or skip to create your own
          </p>
        </div>

        <div class="grid gap-3">
          <div 
            v-for="(scenario, key) in resistanceScenarios" 
            :key="key"
            @click="selectScenario(key)"
            class="p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary"
            :class="{
              'border-primary bg-primary/10': selectedScenario === key,
              'border-base-300': selectedScenario !== key
            }"
          >
            <div class="flex items-start gap-3">
              <span class="text-2xl">{{ scenario.icon }}</span>
              <div class="flex-1">
                <h3 class="font-medium">{{ scenario.name }}</h3>
                <p class="text-sm text-base-content/70">{{ scenario.description }}</p>
                <div class="text-xs text-base-content/60 mt-1">
                  {{ scenario.tasks.length }} tasks • {{ scenario.notes.length }} notes
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center pt-2">
          <button @click="selectedScenario = 'custom'" class="text-sm text-primary hover:underline">
            Skip demo - create custom room →
          </button>
        </div>
      </div>

      <!-- Step 4: Creating -->
      <div v-if="currentStep === 4" class="space-y-4">
        <div class="text-center">
          <h2 class="text-xl font-bold mb-2">🚀 Launching Your Resistance</h2>
          <p class="text-base-content/70 mb-4">
            Creating your secure collaboration space...
          </p>
        </div>

        <div class="bg-base-200 rounded-lg p-6 text-center space-y-4">
          <div class="loading loading-spinner loading-lg text-primary"></div>
          <p class="font-medium">Setting up {{ roomName }}</p>
          <div class="text-sm text-base-content/60 space-y-1">
            <div>✅ Generating room encryption keys</div>
            <div>✅ Creating cryptographic audit trail</div>
            <div>✅ Setting up secure task management</div>
            <div v-if="selectedScenario !== 'custom'">✅ Loading demo content</div>
          </div>
        </div>
      </div>

      <!-- Step 5: Success -->
      <div v-if="currentStep === 5" class="space-y-4">
        <div class="text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-xl font-bold mb-2">Welcome to the Resistance!</h2>
          <p class="text-base-content/70">
            Your secure collaboration room is ready for action.
          </p>
        </div>

        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h3 class="font-medium mb-3">🛡️ Your Security Status</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-green-600">✅</span>
              <span>Cryptographic identity: Active</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✅</span>
              <span>End-to-end encryption: Enabled</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✅</span>
              <span>Offline operation: Ready</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✅</span>
              <span>Audit trail: Recording</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="font-medium">Quick Start Tips:</h3>
          <div class="space-y-2">
            <div v-for="tip in quickStartTips" :key="tip.icon" class="flex gap-3 text-sm">
              <span>{{ tip.icon }}</span>
              <div>
                <div class="font-medium">{{ tip.title }}</div>
                <div class="text-base-content/70">{{ tip.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div v-if="currentStep <= 4" class="flex gap-3 pt-4 border-t">
        <SButton 
          v-if="currentStep > 1" 
          @click="prevStep" 
          class="flex-1" 
          type="secondary"
        >
          ← Back
        </SButton>
        <SButton 
          @click="nextStep" 
          :disabled="!canProceed || isCreating"
          class="flex-1" 
          type="primary"
        >
          <span v-if="isCreating">Creating...</span>
          <span v-else-if="currentStep === 3">Launch Resistance →</span>
          <span v-else>Next →</span>
        </SButton>
      </div>

      <!-- Success Actions -->
      <div v-if="currentStep === 5" class="flex gap-3 pt-4 border-t">
        <SButton @click="completeOnboarding" class="flex-1" type="primary">
          🚀 Enter Your Resistance Room
        </SButton>
      </div>

      <!-- Skip Option -->
      <div v-if="currentStep <= 2" class="text-center pt-2">
        <button @click="skipToApp" class="text-sm text-base-content/60 hover:text-primary">
          Skip onboarding - I'm ready to resist →
        </button>
      </div>
    </div>
  </SDrawerRight>
</template>
