import { ChangeEvent, useMemo, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import * as XLSX from "xlsx";

type SmartImportDialogProps = {
  open: boolean;
  onClose: () => void;
  existingSkus: string[];
};

type DuplicateMode = "skip" | "overwrite";

export function SmartImportDialog({
  open,
  onClose,
  existingSkus,
}: SmartImportDialogProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSkus, setFileSkus] = useState<string[]>([]);
  const [mode, setMode] = useState<DuplicateMode>("skip");

  if (!open) {
    return null;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setFileSkus([]);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) {
        setFileSkus([]);
        return;
      }
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const skuHeaderCandidates = ["Seller SKU", "SellerSku", "seller_sku"];
      const firstRow = rows[0] || {};
      const headers = Object.keys(firstRow);
      const skuKey =
        headers.find((h) =>
          skuHeaderCandidates.some(
            (c) => c.toLowerCase() === String(h).toLowerCase(),
          ),
        ) || headers[0];
      const skus = rows
        .map((row) => String(row[skuKey] || "").trim())
        .filter((v) => v.length > 0);
      setFileSkus(Array.from(new Set(skus)));
    };
    reader.readAsArrayBuffer(file);
  }

  const duplicateCount = useMemo(() => {
    const setExisting = new Set(existingSkus);
    return fileSkus.filter((sku) => setExisting.has(sku)).length;
  }, [existingSkus, fileSkus]);

  const newSkuCount = useMemo(() => {
    if (!fileSkus.length) {
      return 0;
    }
    const setExisting = new Set(existingSkus);
    return fileSkus.filter((sku) => !setExisting.has(sku)).length;
  }, [existingSkus, fileSkus]);

  function handleConfirm() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
      <Card className="w-full max-w-lg space-y-4 bg-slate-950">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Smart Import Inventory
            </p>
            <p className="text-xs text-slate-400">
              Baca file .xlsx/.csv, gunakan Seller SKU sebagai unique ID.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px]"
            onClick={onClose}
          >
            Tutup
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <p className="font-medium text-slate-200">Pilih file</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-200 file:mr-3 file:rounded-md file:border-none file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-50 hover:file:bg-slate-700"
            />
            {fileName && (
              <p className="text-[11px] text-slate-400">
                File terpilih: <span className="text-slate-100">{fileName}</span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-medium text-slate-200">
              Penanganan SKU duplikat
            </p>
            <p className="text-[11px] text-slate-400">
              Seller SKU digunakan sebagai ID unik. Jika file berisi SKU yang
              sudah ada, pilih bagaimana cara menanganinya.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-md border px-3 py-2 text-left text-[11px] ${
                  mode === "skip"
                    ? "border-sky-400 bg-sky-950/40 text-sky-100"
                    : "border-slate-700 bg-slate-900 text-slate-200"
                }`}
                onClick={() => setMode("skip")}
              >
                <p className="font-semibold">Skip duplikat</p>
                <p className="text-[11px] text-slate-400">
                  Abaikan baris yang SKU-nya sudah ada di sistem.
                </p>
              </button>
              <button
                type="button"
                className={`rounded-md border px-3 py-2 text-left text-[11px] ${
                  mode === "overwrite"
                    ? "border-emerald-400 bg-emerald-950/40 text-emerald-100"
                    : "border-slate-700 bg-slate-900 text-slate-200"
                }`}
                onClick={() => setMode("overwrite")}
              >
                <p className="font-semibold">Overwrite duplikat</p>
                <p className="text-[11px] text-slate-400">
                  Timpa data lama dengan data baru untuk SKU yang sama.
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              SKU eksisting saat ini: {existingSkus.length.toLocaleString()}
            </span>
            <div className="flex flex-col items-end">
              <span>
                Dalam file: {fileSkus.length.toLocaleString()} SKU
              </span>
              <span>
                Duplikat: {duplicateCount.toLocaleString()} | Baru:{" "}
                {newSkuCount.toLocaleString()}
              </span>
              <span>
                Mode:{" "}
                <span className="font-semibold text-slate-100">
                  {mode === "skip" ? "Skip duplikat" : "Overwrite duplikat"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            size="sm"
            className="text-xs"
            disabled={!fileName}
            onClick={handleConfirm}
          >
            Proses Import
          </Button>
        </div>
      </Card>
    </div>
  );
}
