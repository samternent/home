<script setup>
import { shallowRef, watch } from "vue";
import { supabaseClient } from "@/service/supabase";
import { useCurrentUser } from "@/module/auth/useCurrentUser";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { onMounted } from "vue";

const { profile, updateProfile } = useCurrentUser();
const { isWhiteLabel } = useWhiteLabel();

const pendingDeletion = shallowRef(false);

async function checkPendingDeletion() {
  const { data, error } = await supabaseClient
    .from("deletions")
    .select()
    .eq("username", profile.value?.username);

  if (data[0]?.username === profile.value?.username) {
    pendingDeletion.value = true;
  }
}
onMounted(checkPendingDeletion);

async function requestAccountDeletion() {
  const { data, error } = await supabaseClient
    .from("deletions")
    .insert({ username: profile.value.username })
    .select();

  if (data[0].username === profile.value.username) {
    pendingDeletion.value = true;
  }
}

const club = shallowRef(null);

const clubs = [
  { key: 'arsenal', name: 'Arsenal' },
  { key: 'astonvilla', name: 'Aston Villa' },
  { key: 'afcbournemouth', name: 'AFC Bournemouth' },
  { key: 'brighton', name: 'Brighton & Hove Albion' },
  { key: 'brentford', name: 'Brentford' },
  { key: 'burnley', name: 'Burnley' },
  { key: 'chelsea', name: 'Chelsea' },
  { key: 'crystalpalace', name: 'Crystal Palace' },
  { key: 'everton', name: 'Everton' },
  { key: 'fulham', name: 'Fulham' },
  { key: 'liverpoolfc', name: 'Liverpool FC' },
  { key: 'luton', name: 'Luton Town' },
  { key: 'mancity', name: 'Manchester City' },
  { key: 'manutd', name: 'Manchester United' },
  { key: 'newcastle', name: 'Newcastle United' },
  { key: 'nottmforest', name: 'Nottingham Forest' },
  { key: 'sheffieldutd', name: 'Sheffield United' },
  { key: 'spurs', name: 'Tottenham Hotspur' },
  { key: 'wolves', name: 'Wolverhampton Wanderers' },
  { key: 'westham', name: 'West Ham United' },
  { key: 'birmingham', name: 'Birmingham City' }
];

watch(club, (_club) => {
  if (_club !== profile.value?.club) {
    updateProfile({ ...profile.value, club: _club });
  }
});

watch(profile, (_profile) => {
  club.value = _profile?.club;
}, { immediate: true });
</script>
<template>
  <div class="mx-auto w-full max-w-4xl p-4">
    <div>
      <p>
        <span
          class="text-4xl sm:text-5xl  font-medium tracking-tighter"
          >{{ profile?.username }}</span
        >
      </p>

      <!-- <div class="form-control w-full max-w-xs" v-if="!isWhiteLabel">
        <label class="label">
          <span class="label-text">Pick your team</span>
        </label>
        <select
          v-model="club"
          aria-label="Clubs"
          class="select select-bordered select-sm mr-4"
        >
          <option value="" disabled>Select club</option>
          <option v-for="_club in clubs" :key="`club${_club}`" :value="_club.key">
            {{ _club.name }}
          </option>
        </select>
      </div> -->
<div class="divider divider-end my-8">Admin</div>
<div class="flex justify-end w-full">
  
  <p >
        <div v-if="pendingDeletion" class="mb-6">
          <p>Deletion request is pending.</p>
          <p>This will be processed within 48 hours</p>
        </div>
        <button :disabled="pendingDeletion" @click="requestAccountDeletion" class="btn btn-error">
          Request account deletion
        </button>
      </p></div>
    </div>
  </div>
</template>
