"use client";

export function BarcodeScanner({
  onDetected,
  onClose
}: {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <h2 className="text-2xl font-black">Barcode Scanner</h2>

        <p className="mt-3 text-sm text-[#6d7d74]">
          Barcode scanner restoration is in progress.
        </p>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() => onDetected("123456789012")}
            className="w-full rounded-2xl border p-3 font-bold"
          >
            Simulate Barcode
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border p-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
