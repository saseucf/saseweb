// app/api/test/route.ts
// This is a simple API route. Students can visit http://localhost:3000/api/test 
// to see the result.

export async function GET() {
  // EXERCISE: Change the message below to something unique!
  return Response.json({ 
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    status: "success"
  });
}
