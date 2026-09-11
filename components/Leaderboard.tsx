import { createServerSupabase } from "@/lib/supabase-server";
import styles from "./Leaderboard.module.css";

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

export default async function Leaderboard() {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, total_points")
        .order("total_points", { ascending: false })
        .limit(20);

    const entries: LeaderboardEntry[] = error || !data ? [] : (data as LeaderboardEntry[]);

    return (
        <div className={styles.leaderboard}>
            <div className={styles.heading}>
                <h2 id="home-leaderboard-title">Leaderboard</h2>
                <p>Top contributors across all SASE UCF events.</p>
            </div>

            {entries.length === 0 ? (
                <div className={styles.empty}>
                    <p>
                        <strong>No leaderboard data yet.</strong>{" "}
                        <span>Earn points by attending events!</span>
                    </p>
                </div>
            ) : (
                <table className={styles.table}>
                    <caption className={styles.srOnly}>SASE UCF event contributor rankings</caption>
                    <thead>
                        <tr>
                            <th scope="col">Rank</th>
                            <th scope="col">Member</th>
                            <th scope="col" className={styles.points}>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, idx) => (
                            <tr key={entry.id} className={idx < 3 ? styles.topRank : undefined}>
                                <td className={styles.rank}>{idx + 1}</td>
                                <th scope="row" className={styles.member}>
                                    <span className={styles.memberIdentity}>
                                        <span className={styles.initials} aria-hidden="true">
                                            {getInitials(entry.full_name ?? "?")}
                                        </span>
                                        <span className={styles.name}>{entry.full_name ?? "Anonymous"}</span>
                                    </span>
                                </th>
                                <td className={styles.points}>
                                    {entry.total_points ?? 0} <span className={styles.unit}>pts</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
