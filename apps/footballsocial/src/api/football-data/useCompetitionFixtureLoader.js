import { shallowRef, watch } from "vue";
import { useAxios } from "../../composables/useAxios";

function normalizeData(data) {
  return data;
}
export default function useFixturesLoader(fixtureId) {
  const api = useAxios();
  const item = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchFixture(_fixtureId = null) {
    if (!_fixtureId) return;
    loading.value = true;
    const { data } = await api.get(`football-data/matches/${_fixtureId}`);
    item.value = normalizeData(data);
    loaded.value = true;
    loading.value = false;
  }

  watch(fixtureId, fetchFixture, { immediate: true });
  return { item, loading, loaded };
}
