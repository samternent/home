import { shallowRef, watch, onBeforeUnmount } from "vue";
import { supabaseClient } from "../service/supabase";
import { useCurrentUser } from "./useCurrentUser";

export type NOTIFICATION = {
  discussion_id: string;
  body: string;
  username: string;
  created_at: string;
};

export function useNotifications() {
  const notifications = shallowRef<NOTIFICATION[]>([]);
  const limit = shallowRef(15);
  const loading = shallowRef(false);
  const page = shallowRef(-1);
  const count = shallowRef<any>(null);
  const { profile } = useCurrentUser();

  const handleInsert = (payload: { new: NOTIFICATION }) => {
    notifications.value = [payload.new, ...notifications.value];
  };

  const notificationsListener = supabaseClient
    .channel(`public:notifications:notifier=eq.${profile.value?.username}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      (payload) => handleInsert(payload)
    )
    .subscribe();

  onBeforeUnmount(() => supabaseClient.removeChannel(notificationsListener));

  async function fetchNotifications() {
    if (count.value && limit.value * page.value >= count.value) {
      return;
    }
    console.log(profile.value.username);
    loading.value = true;
    supabaseClient
      .from("notifications")
      .select("*")
      // .eq("notifier", profile.value?.username)
      .order("created_at", { ascending: false })
      .limit(limit.value)
      .range(limit.value * page.value, limit.value * page.value + limit.value)
      .then((data) => {
        loading.value = false;
        count.value = data.count;
        console.log(data);
        if (!data.error && data.data) {
          notifications.value = [...notifications.value, ...data.data];
        }
      });
  }

  async function loadMore() {
    page.value += 1;
    fetchNotifications();
  }

  return {
    loading,
    notifications,
    fetchNotifications,
    loadMore,
  };
}
