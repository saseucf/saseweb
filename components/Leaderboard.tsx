import { createServerSupabase } from "@/lib/supabase-server";

type LeaderboardEntry = {
    id: string;
    full_name: string | null;
    total_points: number;
    avatar_url?: string | null;
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const rankColors: Record<number, string> = {
    0: "bg-[#dbc8b6] text-[#141b4d]",
    1: "bg-[#c0c0c0] text-[#141b4d]",
    2: "bg-[#cd7f32] text-white",
};

const rankLabels: Record<number, string> = {
    0: "🥇",
    1: "🥈",
    2: "🥉",
};

export default async function Leaderboard() {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, total_points")
        .order("total_points", { ascending: false })
        .limit(20);

    const entries: LeaderboardEntry[] = error || !data ? [] : (data as LeaderboardEntry[]);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-[#89abe3] font-black text-4xl tracking-tight mb-2">Leaderboard</h3>
                <p className="text-[#64708c]">Top contributors across all SASE UCF events.</p>
            </div>
            
            {entries.length === 0 ? (
                <div className="sase-form-card text-center">
                    <p className="text-gray-500 font-medium">No leaderboard data yet. Earn points by attending events!</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#dbe2f0] shadow-[0_12px_30px_rgba(23,29,82,0.06)] overflow-hidden">
                    {entries.map((entry, idx) => (
                        <div
                            key={entry.id}
                            className={`flex items-center justify-between px-6 py-4 border-b border-[#f0f4fb] last:border-0 transition-colors hover:bg-[#f6f8fc] ${rankColors[idx] ?? ""}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="font-black text-lg w-8 text-center">
                                    {rankLabels[idx] ?? idx + 1}
                                </span>
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                                    style={{
                                        background: idx < 3 ? "rgba(0,0,0,0.1)" : "#e9eef8",
                                        color: idx < 3 ? "inherit" : "#89abe3",
                                    }}
                                >
                                    {getInitials(entry.full_name ?? "?")}
                                </div>
                                <span className="font-semibold text-sm">{entry.full_name ?? "Anonymous"}</span>
                            </div>
                            <span className="font-mono font-black text-base tabular-nums">
                                {entry.total_points ?? 0} pts
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
