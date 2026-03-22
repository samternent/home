import { onMounted, onUnmounted, ref } from "vue";

const isOnline = ref(true);
const lastOnlineAt = ref<string | null>(null);

function setOnlineState(next: boolean) {
  isOnline.value = next;
  if (next) {
    lastOnlineAt.value = new Date().toISOString();
  }
}

export function useOfflineSync() {
  const handleOnline = () => setOnlineState(true);
  const handleOffline = () => setOnlineState(false);

  onMounted(() => {
    if (typeof navigator !== "undefined") {
      setOnlineState(navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  });

  return {
    isOnline,
    lastOnlineAt,
  };
}
