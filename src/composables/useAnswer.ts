import { shallowRef, watch, onBeforeUnmount } from "vue";
import { supabaseClient } from "../service/supabase";

export type ANSWER = {
  discussion_id: string;
  body: string;
  username: string;
  created_at: string;
};

export function useAnswer(discussion_id: string) {
  const answers = shallowRef<ANSWER[]>([]);
  const limit = shallowRef(15);
  const loading = shallowRef(false);
  const page = shallowRef(-1);
  const count = shallowRef<any>(null);

  const handleInsert = (payload: { new: ANSWER }) => {
    answers.value = [payload.new, ...answers.value];
  };

  const subscription = supabaseClient
    .from(`answer:discussion_id=eq.${discussion_id}`)
    .on("*", handleInsert)
    .subscribe();

  async function fetchAnswers() {
    if (count.value && limit.value * page.value >= count.value) {
      return;
    }
    loading.value = true;
    supabaseClient
      .from("answer")
      .select("*, profiles (*)", { count: "exact" })
      .eq("discussion_id", discussion_id)
      .order("created_at", { ascending: false })
      .limit(limit.value)
      .range(limit.value * page.value, limit.value * page.value + limit.value)
      .then((data) => {
        loading.value = false;
        count.value = data.count;
        if (!data.error && data.data) {
          answers.value = [...answers.value, ...data.data];
        }
      });
  }

  async function loadMore() {
    page.value += 1;
    fetchAnswers();
  }

  onBeforeUnmount(() => {
    supabaseClient.removeSubscription(subscription);
  });

  const addNewAnswer = async (username: string, body: string) => {
    const { data, error, count } = await supabaseClient.from("answer").insert([
      {
        username,
        discussion_id,
        body,
      },
    ]);
    return { data, error };
  };

  return {
    loading,
    answers,
    addNewAnswer,
    fetchAnswers,
    loadMore,
  };
}
