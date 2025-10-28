import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // collect set-cookie strings here
    const setCookieStrings: string[] = [];

    // create server client with cookie helpers bound to this request/response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          // read cookies from the incoming request header
          getAll: () => {
            const cookieHeader = req.headers.get("cookie") || "";
            if (!cookieHeader) return [];
            return cookieHeader.split(";").map((c) => {
              const [name, ...rest] = c.split("=");
              return { name: name.trim(), value: rest.join("=").trim() };
            });
          },
          // collect cookies that the supabase client wants to set
          setAll: (cookies: Array<{ name: string; value: string }>) => {
            for (const c of cookies) {
              // add secure flags and Path. Adjust attributes as needed for your environment.
              const cookieStr = `${encodeURIComponent(c.name)}=${
                c.value
              }; Path=/; HttpOnly; SameSite=Lax${
                process.env.NODE_ENV === "production" ? "; Secure" : ""
              }`;
              setCookieStrings.push(cookieStr);
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    // attach any Set-Cookie headers produced by the server client
    for (const cs of setCookieStrings) {
      headers.append("Set-Cookie", cs);
    }

    const status = error ? 400 : 200;
    return new Response(JSON.stringify({ data, error }), { status, headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
