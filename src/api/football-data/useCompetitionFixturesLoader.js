import { shallowRef, watch } from "vue";
import api from "../../utils/api";

function normalizeData(data) {
  return data.matches;
}
export default function useFixturesLoader(competitionCode, matchday) {
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchFixtures(_competitionCode = null, _matchday = null) {
    if (!_competitionCode || !_matchday) return;
    loading.value = true;
    const { data } = await api.get(
      `football-data/competitions/${_competitionCode}/matches?matchday=${_matchday}`
    );
    items.value = normalizeData(data);
    loaded.value = true;
    loading.value = false;
  }

  watch(
    [competitionCode, matchday],
    ([_competitionCode, _matchday]) => {
      fetchFixtures(_competitionCode, _matchday);
    },
    { immediate: true }
  );
  return { items, loading, loaded };
}
