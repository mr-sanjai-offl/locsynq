import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  url: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-lg">
        <QRCodeSVG
          value={url}
          size={180}
          level="M"
          bgColor="#ffffff"
          fgColor="#1e1b4b"
        />
      </div>
      <p className="text-xs text-surface-500 text-center max-w-[200px]">
        Scan with your phone to connect
      </p>
    </div>
  );
}
