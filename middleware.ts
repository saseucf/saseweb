import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  const isLandingPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/lumahacks";
  if (host !== "lumahacks.ucfsase.com" && !isLandingPage) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lumahacks-landing", "true");

  if (host === "lumahacks.ucfsase.com" && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/lumahacks";
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/", "/lumahacks"],
};
