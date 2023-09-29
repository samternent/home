import { createClient } from "@supabase/supabase-js";

const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
};

const supabaseClient = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SUPER_KEY || "",
  supabaseOptions
);

export { supabaseClient };
