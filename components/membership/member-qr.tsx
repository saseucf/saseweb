"use client";
import DownloadableQr from "@/components/downloadable-qr";
export default function MemberQr({ displayName, userId }: { displayName: string; userId: string }) {
  return <DownloadableQr value={userId} label={`Event check-in QR code for ${displayName}`} filename="sase-member-qr" />;
}
