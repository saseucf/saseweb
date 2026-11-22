import type { Metadata } from "next";
import { PortalProvider, PortalShell } from "../components/shared";
import "./portal.css";
export const metadata: Metadata = { title: { default: "LumaHacks", template: "%s · LumaHacks" }, description: "Build something bright. The LumaHacks application and hacker portal." };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><PortalProvider><PortalShell>{children}</PortalShell></PortalProvider></body></html>;
}
