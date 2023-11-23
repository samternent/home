import { inject, provide, shallowRef, watch, computed } from "vue";
import { useAxios } from "../../composables/useAxios";

const useCompetitionLoaderSymbol = Symbol("useCompetitionLoader");

export function provideCompetitionLoader(competitionCode) {
  const axios = useAxios();
  const items = shallowRef();
  const loading = shallowRef(false);
  const loaded = shallowRef(false);
  const error = shallowRef(undefined);

  async function fetchCompetitions(_competitionCode = null) {
    if (!_competitionCode) return;
    loading.value = true;
    try {
      const { data } = await axios.get(
        `football-data/competitions/${_competitionCode}`
      );
      items.value = data;
      loaded.value = true;
      loading.value = false;
      error.value = undefined;
    } catch (e) {
      error.value = JSON.parse(JSON.stringify(e));
    }
  }

  const hasItems = computed(() => !loading.value && loaded.value);

  watch(competitionCode, fetchCompetitions, { immediate: true });

  const competitionObject = { items, loading, loaded, hasItems, error };
  provide(useCompetitionLoaderSymbol, competitionObject);
  return competitionObject;
}

export function useCompetitionLoader() {
  return inject(useCompetitionLoaderSymbol);
}
