import { Scanner } from '@yudiel/react-qr-scanner';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-border">
      <Scanner
        onScan={(result) => {
            if (result && result.length > 0) {
                onScan(result[0].rawValue);
            }
        }}
        onError={(error) => {
          if (onError) onError(error as unknown as Error);
          else console.error(error);
        }}
        components={{
          finder: true
        }}
      />
    </div>
  );
}
