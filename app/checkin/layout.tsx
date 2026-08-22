import BottomNav from "@/components/checkin/BottomNav";
import TopNav from "@/components/checkin/TopNav";
import InstallPrompt from "@/components/checkin/InstallPrompt";

export default function CheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background relative pb-20 md:pb-0 md:pt-20">
      {/* TopNav is hidden on mobile, visible on desktop */}
      <TopNav />

      {/* Main content area */}
      <main className="max-w-md mx-auto min-h-[calc(100vh-5rem)] relative px-4 pt-6">
        {children}
      </main>

      <InstallPrompt />
      
      {/* BottomNav is hidden on desktop, visible on mobile */}
      <BottomNav />
    </div>
  );
}
