import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
};

console.log(process.env.VITE_PUBLIC_SUPABASE_URL);

const supabaseClient = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL || "",
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseOptions
);

export { supabaseClient };
