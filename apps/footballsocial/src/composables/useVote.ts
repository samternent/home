import { shallowRef, watch } from "vue";
import { supabaseClient } from "../service/supabase";

export type VOTE = {
  discussion_id: string;
  answer_id: string;
  username: string;
  created_at: string;
  vote: number;
};

export function useVote(discussion_id: string, answer_id: string) {
  const votes = shallowRef<VOTE[]>([]);
  const limit = shallowRef(15);
  const loading = shallowRef(false);

  async function fetchVotes() {
    loading.value = true;
    supabaseClient
      .from("vote")
      .select("*")
      .or(`discussion_id.eq.${discussion_id},answer_id.eq.${answer_id}`)
      .order("created_at", { ascending: false })
      .limit(limit.value)
      .then((data) => {
        loading.value = false;
        if (!data.error && data.data) {
          votes.value = data.data;
        }
      });
  }

  const addNewVote = async (username: string, vote: number) => {
    const { data, error, count } = await supabaseClient.from("vote").upsert(
      {
        id: `${username}-${discussion_id}`,
        username,
        discussion_id,
        answer_id,
        vote,
      },
      { onConflict: "id" }
    );
    return { data, error };
  };

  return {
    loading,
    votes,
    addNewVote,
    fetchVotes,
  };
}
