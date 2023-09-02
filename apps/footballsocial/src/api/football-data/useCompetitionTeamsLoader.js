import { shallowRef, watch } from "vue";
import { useAxios } from "../../composables/useAxios";

export default function useCompetitionLoader(competitionCode) {
  const api = useAxios();
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchCompetitions(_competitionCode = null) {
    if (!_competitionCode) return;
    loading.value = true;
    const { data } = await api.get(
      `football-data/competitions/${_competitionCode}/teams`
    );
    items.value = data;
    loaded.value = true;
    loading.value = false;
  }

  watch(competitionCode, fetchCompetitions, { immediate: true });
  return { items, loading, loaded };
}
