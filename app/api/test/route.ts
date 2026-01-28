// app/api/test/route.ts
// This API route fetches real weather data for Orlando (UCF) using Open-Meteo.
// Students can visit http://localhost:3000/api/test to see the raw JSON.

export async function GET() {
  try {
    // We are fetching data for Orlando, FL (Latitude: 28.5383, Longitude: -81.3792)
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=28.5383&longitude=-81.3792&current_weather=true"
    );
    const data = await response.json();

    return Response.json({
      message: "Weather data fetched successfully!",
      location: "Orlando, FL",
      temperature: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed,
      condition_code: data.current_weather.weathercode,
      unit: "°C"
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch weather data" }, { status: 500 });
  }
}
