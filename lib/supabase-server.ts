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
    // Use unknown and runtime guards instead of `any` to satisfy the linter.
    const raw = await cookies();
    const maybeAll =
      raw &&
      typeof (raw as unknown as { getAll?: unknown }).getAll === "function"
        ? (raw as unknown as { getAll: () => unknown }).getAll()
        : [];
    if (!Array.isArray(maybeAll)) return [];
    return maybeAll
      .filter(
        (c): c is { name?: unknown; value?: unknown } =>
          typeof c === "object" && c !== null
      )
      .map((c) => ({
        name: String((c as { name?: unknown }).name ?? ""),
        value: String((c as { value?: unknown }).value ?? ""),
      }));
  };

  const cookieSetAll = (_cookies: Array<{ name: string; value: string }>) => {
    // no-op in server component context; reference the param to avoid unused-var lint warnings
    void _cookies;
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
