export default function SeaBadge({ shark = false, variant = 0 }: { shark?: boolean; variant?: number }) {
  return <svg viewBox="0 0 100 64" width="72" height="48" role="img" aria-label={shark ? "Shark badge" : "Fish badge"}>
    {shark ? <>
      <path d="M22 34 3 14l5 26-5 19 22-15c25 11 49 6 71-10C73 19 46 17 22 34Z" fill="#a9d9f0" />
      <path d="m46 24 16-22 4 25M48 45l17 16-3-18" fill="#80b8d5" />
      <path d="M31 40c23 7 43 4 57-4-20 15-40 17-57 4Z" fill="#e9f6ff" />
      <path d="m78 38 8-1" stroke="#171d52" strokeWidth="1.5" />
    </> : <>
      <path d="M24 32 4 12v40l20-20C42 7 72 10 96 32 72 54 42 57 24 32Z" fill={["#89abe3", "#66b9c5", "#d4ab75"][variant % 3]} />
      <path d="m44 19 12-16 9 17m-22 25 11 14 10-14" fill="currentColor" opacity=".3" />
      <path d="M46 21q-8 11 0 22m9-25q-8 14 0 28" stroke="white" strokeWidth="3" opacity=".4" fill="none" />
    </>}
    <circle cx="78" cy="29" r="2.5" fill="#171d52" />
  </svg>;
}
