export default function MembershipLoading() {
  return (
    <main className="sase-page" style={{ paddingTop: "120px" }} aria-label="Loading membership">
      <div className="animate-pulse">
        <div className="h-3 w-40 bg-muted" />
        <div className="mt-5 h-12 w-full max-w-md bg-muted" />
        <div className="mt-4 h-5 w-full max-w-2xl bg-muted" />
        <div className="mt-12 h-52 border border-border bg-card" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
          <div className="h-[390px] border border-border bg-card" />
          <div className="space-y-6">
            <div className="h-40 border border-border bg-card" />
            <div className="h-56 border border-border bg-card" />
          </div>
        </div>
      </div>
    </main>
  );
}
