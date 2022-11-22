import { shallowRef, watch } from "vue";
import { supabaseClient } from "../service/supabase";
import { v4 as uuidv4 } from "uuid";

export type COMMENT = {
  id: string;
  comment: string;
  username: string;
  created_at: string;
};

export function useComment() {
  const comments = shallowRef<COMMENT[]>([]);
  const limit = shallowRef(5);
  const loading = shallowRef(false);
  const page = shallowRef(0);
  const count = shallowRef<any>(null);
  const loaded = shallowRef(false);

  async function fetchComments(
    fixture: string,
    team: string,
    competition: string
  ) {
    loading.value = true;
    supabaseClient
      .from("discussion_entity")
      .select(
        "discussion(*, discussion_entity(*), profile: profiles (*), vote(*), answer(*))"
      )
      .or(
        `fixture_id.eq.${fixture},team_id.eq.${team},competition_id.eq.${competition}`
      )
      .order("created_at", { ascending: false })
      .limit(20)
      .then((data) => {
        loading.value = false;
        loaded.value = true;
        if (!data.error && data.data) {
          comments.value = [...data.data, ...comments.value];
        }
      });
  }

  async function loadMore() {
    page.value += 1;
  }
  async function reset() {
    page.value = 0;
  }

  async function fetchCommentsForCompetition(competition: string) {
    if (count.value && limit.value * page.value >= count.value) {
      return;
    }
    loading.value = true;
    supabaseClient
      .from("discussion")
      .select("*,discussion_entity (*), profile: profiles (*), vote(*)", {
        count: "exact",
      })
      .or(`competition.eq.${competition}`)
      .order("reply_count", { ascending: false })
      .limit(limit.value)
      .range(
        limit.value * page.value,
        limit.value * page.value + (limit.value - 1)
      )
      .then((data) => {
        loading.value = false;
        count.value = data.count;
        loaded.value = true;
        if (!data.error && data.data) {
          comments.value = [...comments.value, ...data.data];
        }
      });
  }

  async function fetchCommentById(id: string) {
    loading.value = true;
    supabaseClient
      .from("discussion")
      .select("*,discussion_entity (*), profile: profiles (*)")
      .eq("id", id)
      .order("created_at", { ascending: false })
      .limit(limit.value)
      .single()
      .then((data) => {
        loading.value = false;
        if (!data.error && data.data) {
          comments.value = data.data;
        }
      });
  }

  const addNewComment = async (
    username: string,
    title: string,
    body: string,
    fixture: string,
    teams: Array<any>,
    competition: string
  ) => {
    const { data, error, count } = await supabaseClient
      .from("discussion")
      .insert([
        {
          username,
          title,
          body,
          fixture,
          competition,
        },
      ]);
    if (data?.length) {
      // This is proper dodgy
      for (let i = 0; i < data.length; i++) {
        if (teams) {
          for (let j = 0; j < teams.length; j++) {
            const {
              data: nextData,
              error,
              count,
            } = await supabaseClient.from("discussion_entity").insert([
              {
                username,
                discussion_id: data[i].id,
                team_id: teams[j].id,
                team: teams[j],
                competition_id: competition,
                fixture_id: fixture,
              },
            ]);
          }
        } else {
          const {
            data: nextData,
            error,
            count,
          } = await supabaseClient.from("discussion_entity").insert([
            {
              id: uuidv4(),
              username,
              title,
              body,
              discussion_id: data[i].id,
              competition_id: competition,
            },
          ]);
        }
      }
      comments.value = [...comments.value, ...data];
    }
    return { data, error };
  };

  const increaseLimit = () => {
    limit.value = limit.value + 5;
  };

  return {
    loading,
    loaded,
    comments,
    addNewComment,
    increaseLimit,
    fetch: fetchComments,
    fetchCommentsForCompetition,
    fetchCommentById,
    loadMore,
    reset,
  };
}
