import SeaBadge from "@/components/sea-badge";
import { loadPublicLeaderboard } from "@/lib/leaderboard-server";
import styles from "./Leaderboard.module.css";

export default async function Leaderboard() {
  const { entries, error } = await loadPublicLeaderboard();
  return <div className={styles.leaderboard}>
    <div className={styles.heading}><p className={styles.eyebrow}>Making waves</p><h2 id="program-leaderboard-title">The participation<br />podium.</h2><p>Celebrating our top 10 members by event participation points. Keep showing up. Keep growing.</p></div>
    <p className={styles.help} role="status">{error ? "Rankings are temporarily unavailable. Refresh the page to try again." : "Standings update when you open or refresh this page."}</p>
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
