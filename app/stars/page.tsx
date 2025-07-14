"use client";
import { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";

export default function Page() {
    const [data, setData] = useState<object>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/increment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: "Functions" }),
        })
            .then((res) => res.json())
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((error) => {
                setError("Failed to fetch data: " + error.message);
                setLoading(false);
            });
    }, []);

    return (
        <main className="flex min-h-[70vh] items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Hold on while we add your stars!</CardTitle>
                    <CardDescription>
                        If the text below shows an error let an officer know.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && (
                        <div className="text-muted-foreground text-center py-4">
                            Loading...
                        </div>
                    )}
                    {error && (
                        <div className="text-red-500 text-center py-4">{error}</div>
                    )}
                    {!loading && !error && (
                        <div className="rounded p-4 text-base text-center">
                            {data
                                ? "+50 Stars added to your account!"
                                : error}
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
