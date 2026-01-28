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
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
});

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
        <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background py-20 px-4">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-700">
                <div className="text-center space-y-4">
                    <h1 className={`${montserrat.className} text-4xl md:text-6xl font-black bg-gradient-to-r from-saseblue to-sasegreen bg-clip-text text-transparent p-2`}>
                        Weather Explorer
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                        A practical demonstration of connecting your frontend to a backend API.
                    </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-sasegreen to-saseblue p-1 shadow-2xl transition-transform hover:scale-[1.01] duration-300">
                    <Card className="border-none shadow-none rounded-[calc(var(--radius-xl)-4px)] bg-card/95 backdrop-blur-sm">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                                <Sun className="text-sasegreen animate-pulse" />
                                Live Orlando Data
                            </CardTitle>
                            <CardDescription>
                                Fetched from <code>/api/test</code> (Backend)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-center">
                                <Button
                                    onClick={testApi}
                                    disabled={loading}
                                    size="lg"
                                    className="px-8 font-bold bg-saseblue hover:bg-saseblue/90 text-white transition-all hover:shadow-[0_0_20px_rgba(6,104,179,0.4)]"
                                >
                                    {loading ? "Fetching..." : "Fetch Weather Now"}
                                </Button>
                            </div>

                            {/* DYNAMIC CONTENT: Shows the weather results */}
                            {data && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in zoom-in-95 duration-500">
                                    <div className="flex flex-col items-center p-6 bg-muted/50 rounded-xl border border-saseblue/10">
                                        <Thermometer className="text-saseblue mb-2" size={32} />
                                        <span className="text-3xl font-black text-saseblue">{data.temperature}{data.unit}</span>
                                        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Temperature</span>
                                    </div>
                                    <div className="flex flex-col items-center p-6 bg-muted/50 rounded-xl border border-sasegreen/10">
                                        <Wind className="text-sasegreen mb-2" size={32} />
                                        <span className="text-3xl font-black text-sasegreen">{data.windspeed} km/h</span>
                                        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Wind Speed</span>
                                    </div>
                                    <div className="sm:col-span-2 p-4 bg-sasegreen/10 rounded-lg text-center border border-sasegreen/20">
                                        <p className="text-saseblue font-medium italic">
                                            {data.message}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center font-semibold">
                                    {error}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground italic">
                        Check out <code>teaching/teaching-guide.md</code> to see how this works!
                    </p>
                </div>
            </div>
        </main>
    );
}
