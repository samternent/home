import { inject, provide, shallowRef, watch, computed } from 'vue';
import api from '../../utils/api';

const useCompetitionLoaderSymbol = Symbol('useCompetitionLoader');

export function provideCompetitionLoader(competitionCode) {
	const items = shallowRef();
	const loading = shallowRef(false);
	const loaded = shallowRef(false);

	async function fetchCompetitions(_competitionCode = null) {
		if (!_competitionCode) return;
		loading.value = true;
		const { data } = await api.get(
			`football-data/competitions/${_competitionCode}`
		);
		items.value = data;
		loaded.value = true;
		loading.value = false;
	}

	const hasItems = computed(() => !loading.value && loaded.value);

	watch(competitionCode, fetchCompetitions, { immediate: true });

	const competitionObject = { items, loading, loaded, hasItems };
	provide(useCompetitionLoaderSymbol, competitionObject);
	return competitionObject;
}

export function useCompetitionLoader() {
	return inject(useCompetitionLoaderSymbol);
}
