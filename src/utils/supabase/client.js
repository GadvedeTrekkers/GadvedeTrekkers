/**
 * src/utils/supabase/client.js
 *
 * Single shared Supabase browser client for the Vite + React frontend.
 * Import `supabase` from here wherever you need to query Supabase directly.
 *
 * This is a pure browser client — no SSR, no Next.js cookies.
 * The backend uses its own admin client (backend/src/config/supabaseAdminClient.js).
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://qgiqkxxwoyqffozgvbvi.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaXFreHh3b3lxZmZvemd2YnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzODQsImV4cCI6MjA4NDc2NzM4NH0.LufpdVhrHr-yrrC-45AL-69s_YGBhm5qmzdcDGAPAio";

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export default supabase;
