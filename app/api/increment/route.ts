// HTTP function access supabase edge function
export async function POST(request: Request) {
  const body = await request.json();

  const supabaseResponse = await fetch(
    "https://iwimnudodmiijqhnkrcr.supabase.co/functions/v1/test",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aW1udWRvZG1paWpxaG5rcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTUxNzksImV4cCI6MjA2NTQzMTE3OX0.gGwyXCAxHOFsAzxwbuInbQ_WfpjVlxoiqqbUukBdBJM",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await supabaseResponse.json();

  return Response.json(data);
}
