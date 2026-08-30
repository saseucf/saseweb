"use client";

import { QRCodeSVG } from "qrcode.react";

type MemberQrProps = {
  displayName: string;
  userId: string;
};

export default function MemberQr({ displayName, userId }: MemberQrProps) {
  const label = `Event check-in QR code for ${displayName}`;

  return (
    <div className="w-full max-w-[300px]" role="img" aria-label={label}>
      <QRCodeSVG
        value={userId}
        level="H"
        size={300}
        includeMargin={false}
        fgColor="#141b4d"
        bgColor="#f6f8fc"
        title={label}
        className="h-auto w-full"
      />
    </div>
  );
}
