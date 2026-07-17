require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing Supabase connection to:", supabaseUrl);
  try {
    // Attempt to query the profiles table (it might be empty or throw an error if it doesn't exist)
    const { data, error } = await supabase.from("profiles").select("*").limit(1);

    if (error) {
      if (error.code === "PGRST204") {
         // Table not found error
         console.error("❌ Connection successful, but the 'profiles' table does not exist yet.");
         console.log("💡 Tip: Run the SQL in `database/schema.sql` in your Supabase SQL Editor!");
      } else {
         console.error("❌ Connection error:", error.message);
      }
    } else {
      console.log("✅ Connection successful! The 'profiles' table exists.");
    }
  } catch (err) {
    console.error("❌ Unexpected error during connection test:", err.message);
  }
}

testConnection();
