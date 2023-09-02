import { shallowRef, watch } from "vue";
import { useAxios } from "../../composables/useAxios";

export default function useLegueLoader({ country }) {
  const api = useAxios();
  const items = shallowRef();

  try {
    watch(country, (_country) => {
      if (!_country) return;
      api
        .get("sports-api/leagues", {
          params: {
            country: _country,
          },
        })
        .then(({ data: { response } }) => {
          items.value = response[0];
        });
    });
  } catch (e) {
    throw Error(e);
  }

  return { items };
}
