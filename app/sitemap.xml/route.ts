const ROUTES = [
  "/",
  "/about",
  "/about/board",
  "/about/sponsors",
  "/events",
  "/leaderboard",
  "/login",
  "/profile",
  "/programs",
  "/register",
  "/resources",
  "/stars",
];

export async function GET() {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://ucfsase.com"
  ).replace(/\/$/, "");

  const lastmod = new Date().toISOString();

  const urls = ROUTES.map((route) => {
    return `
    <url>
      <loc>${baseUrl}${route}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
  </urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
