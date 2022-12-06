import { shallowRef, watch } from "vue";
import api from "../../utils/api";

export default function useTeamLoader(teamId) {
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchTeam(_teamId = null) {
    if (!_teamId) return;
    loading.value = true;
    const { data } = await api.get(
      `football-data/teams/${_teamId}?season=1999`
    );
    items.value = data;
    loaded.value = true;
    loading.value = false;
  }

  watch(teamId, fetchTeam, { immediate: true });
  return { items, loading, loaded };
}
