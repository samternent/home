import { createClient } from "@supabase/supabase-js";

const supabaseOptions = {
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
