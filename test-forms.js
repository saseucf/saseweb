require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// use service role key so we bypass RLS for schema introspection if needed
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function testForms() {
  const { data, error } = await supabase.from("forms").select("id, title, events(event_type)");
  if (error) {
    console.error("Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Forms data:", JSON.stringify(data, null, 2));
  }
}
testForms();
