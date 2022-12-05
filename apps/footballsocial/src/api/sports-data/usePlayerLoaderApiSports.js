import { shallowRef } from "vue";
import api from "../utils/api";

export default function useFetcher({ team } = { team: 1 }) {
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
