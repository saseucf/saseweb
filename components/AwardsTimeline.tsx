import styles from "./AwardsTimeline.module.css";

type AwardYear = {
    year: string;
    groups: { organization: string; items: string[] }[];
};

const recentAwards: AwardYear[] = [
    {
        year: "2025–2026",
        groups: [{
            organization: "National SASE",
            items: ["Hosted the Southeast Regional Conference (SERC) 2026"],
        }],
    },
    {
        year: "2024–2025",
        groups: [
            {
                organization: "SASE Inspire Awards",
                items: ["Most Improved Chapter (Honorable Mention)"],
            },
            {
                organization: "APAC Hidden Lotus Awards",
                items: ["Organization of Distinction", "Most Improved Organization", "Best New Media Initiative"],
            },
        ],
    },
];

const earlierAwards: AwardYear[] = [
    {
        year: "2023–2024",
        groups: [{
            organization: "APAC Hidden Lotus Awards",
            items: ["Most Innovative Organization"],
        }],
    },
    {
        year: "2023",
        groups: [{
            organization: "National SASE",
            items: ["Selected to host the Southeast Regional Conference (SERC)"],
        }],
    },
    {
        year: "2022–2023",
        groups: [{
            organization: "APAC Hidden Lotus Awards",
            items: ["Most Innovative Organization", "Organization of Distinction"],
        }],
    },
];

function AwardYears({ entries }: { entries: AwardYear[] }) {
    return (
        <ol className={styles.years} role="list">
            {entries.map((entry) => (
                <li key={entry.year} className={styles.entry}>
                    <h3 className={styles.year}>{entry.year}</h3>
                    <div className={styles.groups}>
                        {entry.groups.map((group) => (
                            <div key={group.organization}>
                                <h4 className={styles.organization}>{group.organization}</h4>
                                <ul className={styles.awards} role="list">
                                    {group.items.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </li>
            ))}
        </ol>
    );
}

export default function AwardsTimeline() {
    return (
        <div className={styles.timeline}>
            <AwardYears entries={recentAwards} />
            <details className={styles.history}>
                <summary>
                    <span>Earlier years <span className={styles.dateRange}>2022–2024</span></span>
                    <span className={styles.toggle} aria-hidden="true" />
                </summary>
                <AwardYears entries={earlierAwards} />
            </details>
            <p className={styles.note}>
                APAC&apos;s Hidden Lotus Awards recognize student organizations for cultural awareness, advocacy, and community engagement.
            </p>
        </div>
    );
}
