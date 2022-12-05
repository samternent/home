import { shallowRef } from "vue";
import { supabaseClient } from "../service/supabase";
import useSuggestion from "../utils/suggestion";

export function useMentions() {
  const people = shallowRef([]);

  const isReady = supabaseClient
    .from("profiles")
    .select("*")
    .then(({ data }) => {
      people.value = data?.map(({ username }) => username);
    });

  return useSuggestion(people, isReady);
}
