"use client";

import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, Sun, Wind, Thermometer } from "lucide-react";

export default function HelloPage() {
    // STATE: Used to store weather data and manage loading/error states
    const [data, setData] = useState<{
        message: string;
        location: string;
        temperature: number;
        windspeed: number;
        unit: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // FETCH FUNCTION: Calls our local API which fetches from Open-Meteo
    const testApi = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/test");
            const json = await response.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err) {
            setError("Failed to fetch weather data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                        <Sun className="text-yellow-500" />
                        Weather Explorer
                    </CardTitle>
                    <CardDescription>
                        Learning how to connect Frontend to Backend with real data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <p className="text-muted-foreground">
                        This page calls our internal API at <code>/api/test</code>, which then fetches data from <strong>Open-Meteo</strong>.
                    </p>

                    <div className="flex justify-center">
                        <Button onClick={testApi} disabled={loading} size="lg" className="w-full sm:w-auto">
                            {loading ? "Fetching..." : "Get Orlando Weather"}
                        </Button>
                    </div>

                    {/* DYNAMIC CONTENT: Shows the weather results */}
                    {data && (
                        <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="font-semibold text-lg">{data.location}</span>
                                <Cloud className="text-blue-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                                    <Thermometer className="text-orange-500 mb-1" size={20} />
                                    <span className="text-2xl font-bold">{data.temperature}{data.unit}</span>
                                    <span className="text-xs text-muted-foreground uppercase">Temp</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                                    <Wind className="text-blue-500 mb-1" size={20} />
                                    <span className="text-2xl font-bold">{data.windspeed} km/h</span>
                                    <span className="text-xs text-muted-foreground uppercase">Wind</span>
                                </div>
                            </div>
                            <p className="text-sm text-green-600 font-medium whitespace-pre-line">✨ {data.message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-800 rounded-md border border-red-100">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
