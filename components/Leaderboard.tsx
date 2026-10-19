import CsvDownloadButton from "@/components/csv-download-button";
import SeaBadge from "@/components/sea-badge";
import { createAdminSupabase } from "@/lib/supabase-server";
import { queryLeaderboard, rankLeaderboard } from "@/lib/leaderboard";
import styles from "./Leaderboard.module.css";

export default async function Leaderboard() {
  const { data, error } = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await queryLeaderboard(createAdminSupabase())
    : { data: null, error: true };
  const entries = rankLeaderboard(data ?? []);
  return <div className={styles.leaderboard}>
    <div className={styles.heading}><p className={styles.eyebrow}>Making waves</p><h2 id="program-leaderboard-title">The participation<br />podium.</h2><p>Celebrating our top 10 members by event participation points. Keep showing up. Keep growing.</p></div>
    {error ? <p role="status" className={styles.empty}>Rankings are temporarily unavailable. Please check back soon.</p> : !entries.length ? <p className={styles.empty}>The next wave starts with you. Attend an event to earn points.</p> : <>
      <CsvDownloadButton filename="sase-top-10" rows={entries.map(entry => ({ rank: entry.rank, name: entry.name, participation_points: entry.total_points }))} label="Download top 10 (CSV)" />
      <p id="leaderboard-help" className={styles.help}>Scroll to explore the top members. Equal points share a rank. Administrators are excluded.</p>
      <ol className={styles.track} tabIndex={0} aria-label="Top 10 members by participation points" aria-describedby="leaderboard-help">
        {entries.map((entry) => {
          const rank = entry.rank;
          return <li key={entry.id} className={`${styles.card} ${rank === 1 ? styles.champion : ""}`}>
            <span className={styles.rank}>#{rank.toString().padStart(2, "0")}</span>
            <span className={styles.fish}><SeaBadge shark={rank === 1} variant={rank} /></span>
            <h3>{entry.name}</h3>
            <p className={styles.points}>{entry.total_points ?? 0}<span>participation points</span></p>
            {rank === 1 && <span className={styles.crown}>Leading the school</span>}
          </li>;
        })}
      </ol>
    </>}
  </div>;
}
