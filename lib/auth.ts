import { createBrowserSupabase } from "@/lib/supabase-client";

// Keep one browser client so every client component shares the same
// cookie-backed session that Server Components and Route Handlers read.
const supabase = createBrowserSupabase();

export default supabase;
