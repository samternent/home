import { computed, ref } from "vue";

const openRef = ref(false);

export function useRedeemComposer() {
  const open = computed(() => openRef.value);

  function openComposer() {
    openRef.value = true;
  }

  function closeComposer() {
    openRef.value = false;
  }

  function toggleComposer() {
    openRef.value = !openRef.value;
  }

  return {
    open,
    openComposer,
    closeComposer,
    toggleComposer,
  };
}
