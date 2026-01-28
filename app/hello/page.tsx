"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HelloPage() {
    // STATE: Used to store data and manage loading/error states
    const [data, setData] = useState<{ message: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // FETCH FUNCTION: Calls the API we created in app/api/test/route.ts
    const testApi = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/test");
            const json = await response.json();
            setData(json);
        } catch (err) {
            setError("Failed to fetch from API");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Hello SASE!</CardTitle>
                    <CardDescription>
                        This is your first frontend page in the UCF SASE project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                        Click the button below to test if your backend API is working.
                    </p>

                    <div className="flex justify-center">
                        <Button onClick={testApi} disabled={loading}>
                            {loading ? "Testing..." : "Test Backend API"}
                        </Button>
                    </div>

                    {/* DYNAMIC CONTENT: Shows the API result or an error */}
                    {data && (
                        <div className="p-4 bg-green-100 text-green-800 rounded-md border border-green-200 animate-in fade-in zoom-in duration-300">
                            <strong>Success!</strong> {data.message}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-100 text-red-800 rounded-md border border-red-200">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
