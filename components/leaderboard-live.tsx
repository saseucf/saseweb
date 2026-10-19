"use client";
import { useEffect, useState } from "react";
import SeaBadge from "@/components/sea-badge";
import type { PublicLeaderboardEntry } from "@/lib/leaderboard";
import { pollLeaderboard } from "@/lib/leaderboard-polling";
import styles from "./Leaderboard.module.css";

export default function LeaderboardLive({ initialEntries, initialError }: { initialEntries: PublicLeaderboardEntry[]; initialError: boolean }) {
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState(initialError);
  useEffect(() => {
    const poller = pollLeaderboard({
      visible: () => document.visibilityState === "visible",
      load: async signal => {
        const response = await fetch("/api/leaderboard", { cache: "no-store", signal });
        if (!response.ok) throw new Error("Rankings unavailable");
        const result = await response.json();
        if (!Array.isArray(result.entries) || result.entries.length > 10) throw new Error("Invalid rankings");
        return result.entries as PublicLeaderboardEntry[];
      },
      update: next => {
        setEntries(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
        setError(false);
      },
      failed: () => setError(true),
    });
    const refresh = () => void poller.refresh();
    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      poller.stop();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);

  return <div className={styles.leaderboard}>
    <div className={styles.heading}><p className={styles.eyebrow}>Making waves</p><h2 id="program-leaderboard-title">The participation<br />podium.</h2><p>Celebrating our top 10 members by event participation points. Keep showing up. Keep growing.</p></div>
    <p className={styles.help} role="status">{error ? "Live updates are temporarily unavailable. Retrying automatically." : "Live standings · Updates automatically"}</p>
    {!entries.length ? <p className={styles.empty}>{error ? "Rankings are temporarily unavailable. Please check back soon." : "The next wave starts with you. Attend an event to earn points."}</p> : <>
      <p id="leaderboard-help" className={styles.help}>Scroll to explore the top members. Equal points share a rank. Administrators are excluded.</p>
      <ol className={styles.track} tabIndex={0} aria-label="Top 10 members by participation points" aria-describedby="leaderboard-help">
        {entries.map((entry, index) => <li key={`${entry.name}-${index}`} className={`${styles.card} ${entry.rank === 1 ? styles.champion : ""}`}>
          <span className={styles.rank}>#{entry.rank.toString().padStart(2, "0")}</span>
          <span className={styles.fish}><SeaBadge shark={entry.rank === 1} variant={entry.rank} /></span>
          <h3>{entry.name}</h3>
          <p className={styles.points}>{entry.total_points}<span>participation points</span></p>
          {entry.rank === 1 && <span className={styles.crown}>Leading the school</span>}
        </li>)}
      </ol>
    </>}
  </div>;
}
