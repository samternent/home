import { shallowRef, watch } from "vue";
import api from "../../utils/api";

function normalizeData(data) {
  return data.matches;
}
function normalizeMeta(data) {
  return {
    ...data.resultSet,
    competition: data.competition,
  };
}
export default function useFixturesLoader(competitionCode, stage, matchday) {
  const items = shallowRef([]);
  const meta = shallowRef({});
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchFixtures(
    _competitionCode = null,
    _stage = null,
    _matchday = null
  ) {
    if (!_competitionCode) return;
    loading.value = true;
    const params = {};
    if (_matchday) {
      params.matchday = _matchday;
    }
    if (_stage) {
      params.stage = _stage;
    }
    const queryString = Object.keys(params)
      .map((key) => key + "=" + params[key])
      .join("&");
    const { data } = await api.get(
      `football-data/competitions/${_competitionCode}/matches?${queryString}`
    );
    items.value = normalizeData(data);
    meta.value = normalizeMeta(data);
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
  return { items, loading, loaded, meta };
}
