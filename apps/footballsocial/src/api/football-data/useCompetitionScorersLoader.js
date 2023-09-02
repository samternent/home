import { shallowRef, watch } from "vue";
import { useAxios } from "../../composables/useAxios";

export default function useTableLoader(competitionCode) {
  const api = useAxios();
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);

  async function fetchTable(_competitionCode = null) {
    if (!_competitionCode) return;
    loading.value = true;
    const { data } = await api.get(
      `football-data/competitions/${_competitionCode}/scorers`
    );
    items.value = data;
    loaded.value = true;
    loading.value = false;
  }

  watch(competitionCode, fetchTable, { immediate: true });
  return { items, loading, loaded };
}
