import { shallowRef } from "vue";
import { useAxios } from "../../composables/useAxios";

export default function useFetcher({ id } = { id: 1 }) {
  const api = useAxios();
  const items = shallowRef();

  api
    .get("sports-api/countries", {
      // params: {
      //   id,
      // },
    })
    .then(({ data: { response } }) => {
      items.value = response;
    });

  return { items };
}
