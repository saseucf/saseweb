import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (host === "lumahacks.ucfsase.com" && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/lumahacks";
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-lumahacks-landing", "true");
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  if (host !== "lumahacks.ucfsase.com" && request.nextUrl.pathname === "/lumahacks") {
    const url = request.nextUrl.clone();
    url.pathname = "/forms/lumahacks";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/lumahacks"],
};
