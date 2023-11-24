import { createClient, SupabaseClientOptions } from "@supabase/supabase-js";

const supabaseOptions: SupabaseClientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    broadcast: false,
  },
};

const supabaseClient = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL || "",
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseOptions
);

export { supabaseClient };
