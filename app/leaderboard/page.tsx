import React from "react";
import { Card } from "@/components/ui/card";

export const metadata = {
    title: "Leaderboard",
    description: "Leaderboard — top contributors and member standings for SASE UCF.",
} as const;
import { Avatar } from "@/components/ui/avatar";
import supabase from "@/lib/auth";
import Image from "next/image";

type LeaderboardEntry = {
    id: number;
    name: string;
    score: number;
    imageUrl?: string;
};


const data = await supabase.from("profiles").select("*")
console.log("hello" + data)

const leaderboardData: LeaderboardEntry[] = [
    { id: 1, name: "Alice Johnson", score: 1500, imageUrl: undefined },
    { id: 2, name: "Bob Smith", score: 1200, imageUrl: undefined },
    { id: 3, name: "Charlie Lee", score: 1100, imageUrl: undefined },
    { id: 4, name: "Dana White", score: 950, imageUrl: undefined },
    { id: 5, name: "Evan Green", score: 900, imageUrl: undefined },
];

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

const Page = () => {
    return (
        <div className="min-h-screen w-full overflow-x-clip flex justify-center items-center bg-background">
            <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg p-4 sm:p-6 md:p-10 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">Leaderboard</h2>
                <div>
                    {leaderboardData.map((entry, idx) => (
                        <div
                            key={entry.id}
                            className={`flex items-center justify-between py-3 px-2 rounded-md ${idx === 0
                                ? "bg-awardyellow"
                                : idx === 1
                                    ? "bg-gray-700"
                                    : idx === 2
                                        ? "bg-orange-900"
                                        : ""
                                } mb-2`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-semibold w-6 text-center">{idx + 1}</span>
                                <Avatar>
                                    {entry.imageUrl ? (
                                        <Image
                                            src={entry.imageUrl}
                                            alt={entry.name}
                                            className="rounded-full w-8 h-8"
                                        />
                                    ) : (
                                        <div className="bg-gray-300 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                            {getInitials(entry.name)}
                                        </div>
                                    )}
                                </Avatar>
                                <span className="font-medium">{entry.name}</span>
                            </div>
                            <span className="font-mono font-bold">{entry.score}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Page;
