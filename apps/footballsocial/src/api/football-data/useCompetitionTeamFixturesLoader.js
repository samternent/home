import { shallowRef, watch } from "vue";
import { useAxios } from "../../composables/useAxios";

function normalizeData(data) {
  return data.matches;
}
export default function useFixturesLoader(teamId) {
  const api = useAxios();
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchFixtures(_teamId = null) {
    if (!_teamId) return;
    loading.value = true;
    const { data } = await api.get(`football-data/teams/${_teamId}/matches`);
    items.value = normalizeData(data);
    loaded.value = true;
    loading.value = false;
  }

  watch(
    teamId,
    (_teamId) => {
      fetchFixtures(_teamId);
    },
    { immediate: true }
  );
  return { items, loading, loaded };
}
