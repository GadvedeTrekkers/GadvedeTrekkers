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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export default supabase;
