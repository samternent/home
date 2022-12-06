import { shallowRef } from "vue";
import api from "../utils/api";

export default function useFetcher({ id } = { id: 1 }) {
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
