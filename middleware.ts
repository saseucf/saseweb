import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (host !== "lumahacks.ucfsase.com" || request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/lumahacks";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/"],
};
