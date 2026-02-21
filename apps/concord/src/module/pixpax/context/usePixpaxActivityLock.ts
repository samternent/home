import { computed, shallowRef } from "vue";

export type PixpaxActivityLock = "pack-open";

const locks = shallowRef<Record<PixpaxActivityLock, boolean>>({
  "pack-open": false,
});

export function usePixpaxActivityLock() {
  function setActivityLock(lock: PixpaxActivityLock, value: boolean) {
    locks.value = {
      ...locks.value,
      [lock]: Boolean(value),
    };
  }

  function isActivityLocked(lock?: PixpaxActivityLock) {
    if (lock) return Boolean(locks.value[lock]);
    return Object.values(locks.value).some(Boolean);
  }

  const activeLocks = computed(() =>
    Object.entries(locks.value)
      .filter(([, value]) => Boolean(value))
      .map(([name]) => name as PixpaxActivityLock)
  );

  return {
    locks,
    activeLocks,
    setActivityLock,
    isActivityLocked,
  };
}
