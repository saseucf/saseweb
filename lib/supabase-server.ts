import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabase() {
  // createServerClient expects cookies.getAll & setAll helpers.
  // For server components we only need read access (getAll).
  // setAll is a no-op here; API routes that sign-in/sign-out should
  // provide a setAll implementation that attaches cookies to the response.
  const cookieGetAll = async (): Promise<
    Array<{ name: string; value: string }>
  > => {
    // Next's cookies() typing can vary across versions; ensure we await cookies() to avoid
    // the "cookies().getAll() should be awaited" runtime error in newer Next versions.
    const raw = await (cookies as any)();
    const all = raw && typeof raw.getAll === "function" ? raw.getAll() : [];
    return all.map((c: any) => ({
      name: String(c.name),
      value: String(c.value),
    }));
  };

  const cookieSetAll = (_: Array<{ name: string; value: string }>) => {
    // no-op in server component context
    return;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll: cookieGetAll,
        setAll: cookieSetAll,
      },
    }
  );
}
