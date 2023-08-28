import { supabaseClient } from "../service/supabase";
import { useCurrentUser } from "./useCurrentUser";


const { profile } = useCurrentUser();

export async function createLeague(name, {
  owner, commissioner
 }) {
  const { data, error } = await supabaseClient
    .from("leagues")
    .insert([
      {
        name,
        owner: profile.value.username,
        commissioner: profile.value.username,
        created_by: profile.value.username,
      },
    ])
    .select();

  console.log(data);
}
