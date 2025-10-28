import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, username } = body;

    const setCookieStrings: string[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll: () => {
            const cookieHeader = req.headers.get("cookie") || "";
            if (!cookieHeader) return [];
            return cookieHeader.split(";").map((c) => {
              const [name, ...rest] = c.split("=");
              return { name: name.trim(), value: rest.join("=").trim() };
            });
          },
          setAll: (cookies: Array<{ name: string; value: string }>) => {
            for (const c of cookies) {
              // Add cookie attributes. Adjust as needed for your environment.
              const cookieStr = `${encodeURIComponent(c.name)}=${
                c.value
              }; Path=/; HttpOnly; SameSite=Lax; Secure`;
              setCookieStrings.push(cookieStr);
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
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
