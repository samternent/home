import { shallowRef, watch } from "vue";
import api from "../../utils/api";

function normalizeData(data) {
  return data.matches;
}
export default function useFixturesLoader(competitionCode, stage, matchday) {
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchFixtures(
    _competitionCode = null,
    _stage = "GROUP_STAGE",
    _matchday = null
  ) {
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
    [competitionCode, stage, matchday],
    ([_competitionCode, _stage, _matchday]) => {
      fetchFixtures(_competitionCode, _stage, _matchday);
    },
    { immediate: true }
  );
  return { items, loading, loaded };
}
