import { shallowRef } from "vue";
import { useAxios } from "../../composables/useAxios";

export default function useFetcher({ team } = { team: 1 }) {
  const api = useAxios();
  const items = shallowRef();

  api
    .get("sports-api/players/squads", {
      params: {
        team,
      },
    })
    .then(({ data: { response } }) => {
      items.value = response[0];
    });

  return { items };
}
