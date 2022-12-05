import { shallowRef, watch } from "vue";
import api from "../../utils/api";

export default function usePlayerLoader(playerId) {
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchPlayer(_playerId = null) {
    if (!_playerId) return;
    loading.value = true;
    const { data } = await api.get(`football-data/persons/${_playerId}`);
    items.value = data;
    loaded.value = true;
    loading.value = false;
  }

  watch(playerId, fetchPlayer, { immediate: true });
  return { items, loading, loaded };
}
