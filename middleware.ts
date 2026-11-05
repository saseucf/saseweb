import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/lumahacks") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/forms/lumahacks";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/lumahacks"],
};
