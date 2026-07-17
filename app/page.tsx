export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground">
      <main className="flex flex-col items-center max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-primary">
          SASE UCF
        </h1>
        <p className="text-xl text-muted-foreground">
          Welcome to the new SASE Web Dev workspace. This is a clean slate to build our new member portal!
        </p>
        <div className="flex gap-4 pt-4">
          <div className="px-6 py-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            Next.js 15
          </div>
          <div className="px-6 py-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            Tailwind CSS
          </div>
          <div className="px-6 py-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            Supabase
          </div>
        </div>
      </main>
    </div>
  );
}
