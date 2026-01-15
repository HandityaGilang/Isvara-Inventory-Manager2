import { useMemo, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SmartImportDialog } from "../import/SmartImportDialog";

export type InventoryItem = {
  sellerSku: string;
  productName: string;
  category: string;
  status: string;
  sizeS: number;
  sizeM: number;
  sizeL: number;
  sizeXL: number;
  sizeXXL: number;
  sizeXXXL: number;
  sizeOneSize: number;
};

type InventoryPageProps = {
  searchQuery: string;
};

const sampleInventory: InventoryItem[] = [
  {
    sellerSku: "ZLR-TSHIRT-BASIC-BLACK-S",
    productName: "Basic Tee Hitam",
    category: "T-Shirt",
    status: "Aktif",
    sizeS: 0,
    sizeM: 1,
    sizeL: 0,
    sizeXL: 0,
    sizeXXL: 0,
    sizeXXXL: 0,
    sizeOneSize: 0,
  },
  {
    sellerSku: "ZLR-DRESS-FLORAL-01",
    productName: "Floral Dress Summer",
    category: "Dress",
    status: "Aktif",
    sizeS: 3,
    sizeM: 4,
    sizeL: 2,
    sizeXL: 1,
    sizeXXL: 0,
    sizeXXXL: 0,
    sizeOneSize: 0,
  },
  {
    sellerSku: "SHP-HOODIE-OVERSIZE-GREY-ONE",
    productName: "Hoodie Oversize Abu",
    category: "Outerwear",
    status: "Aktif",
    sizeS: 0,
    sizeM: 0,
    sizeL: 0,
    sizeXL: 0,
    sizeXXL: 0,
    sizeXXXL: 0,
    sizeOneSize: 2,
  },
  {
    sellerSku: "ZLR-PANTS-CHINO-BEIGE-M",
    productName: "Chino Pants Beige",
    category: "Bottom",
    status: "Preorder",
    sizeS: 0,
    sizeM: 0,
    sizeL: 0,
    sizeXL: 0,
    sizeXXL: 0,
    sizeXXXL: 0,
    sizeOneSize: 0,
  },
];

function getTotalQuantity(item: InventoryItem) {
  return (
    item.sizeS +
    item.sizeM +
    item.sizeL +
    item.sizeXL +
    item.sizeXXL +
    item.sizeXXXL +
    item.sizeOneSize
  );
}

function getRowClass(total: number) {
  if (total === 0) {
    return "bg-red-950/60";
  }
  if (total >= 1 && total <= 3) {
    return "bg-amber-950/60";
  }
  return "bg-slate-900/40";
}

export function InventoryPage({ searchQuery }: InventoryPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [importOpen, setImportOpen] = useState(false);

  const items = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sampleInventory.filter((item) => {
      const total = getTotalQuantity(item);
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const combined =
        `${item.sellerSku} ${item.productName} ${item.category} ${item.status}`.toLowerCase();
      return combined.includes(q) || total.toString() === q;
    });
  }, [categoryFilter, statusFilter, searchQuery]);

  const categories = useMemo(
    () => Array.from(new Set(sampleInventory.map((i) => i.category))),
    [],
  );

  const statuses = useMemo(
    () => Array.from(new Set(sampleInventory.map((i) => i.status))),
    [],
  );

  const existingSkus = useMemo(
    () => sampleInventory.map((i) => i.sellerSku),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setImportOpen(true)}>
            Smart Import
          </Button>
          <Button size="sm" variant="outline">
            Export Excel
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-50"
            >
              <option value="all">Semua</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-50"
            >
              <option value="all">Semua</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <Card className="min-h-[320px] overflow-hidden">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            Retail Clothing Inventory
          </h2>
          <span className="text-xs text-slate-400">
            Warna baris mengikuti level stok.
          </span>
        </div>
        <div className="overflow-auto rounded-md border border-slate-800">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Seller SKU</th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-center">S</th>
                <th className="px-2 py-2 text-center">M</th>
                <th className="px-2 py-2 text-center">L</th>
                <th className="px-2 py-2 text-center">XL</th>
                <th className="px-2 py-2 text-center">XXL</th>
                <th className="px-2 py-2 text-center">XXXL</th>
                <th className="px-2 py-2 text-center">ONESIZE</th>
                <th className="px-3 py-2 text-center">Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const total = getTotalQuantity(item);
                return (
                  <tr
                    key={item.sellerSku}
                    className={`${getRowClass(
                      total,
                    )} border-t border-slate-800 text-[11px] text-slate-100`}
                  >
                    <td className="px-3 py-2 font-medium text-sky-200">
                      {item.sellerSku}
                    </td>
                    <td className="px-3 py-2">{item.productName}</td>
                    <td className="px-3 py-2 text-slate-300">
                      {item.category}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{item.status}</td>
                    <td className="px-2 py-2 text-center">{item.sizeS}</td>
                    <td className="px-2 py-2 text-center">{item.sizeM}</td>
                    <td className="px-2 py-2 text-center">{item.sizeL}</td>
                    <td className="px-2 py-2 text-center">{item.sizeXL}</td>
                    <td className="px-2 py-2 text-center">{item.sizeXXL}</td>
                    <td className="px-2 py-2 text-center">{item.sizeXXXL}</td>
                    <td className="px-2 py-2 text-center">
                      {item.sizeOneSize}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">
                      {total}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-3 py-6 text-center text-xs text-slate-500"
                  >
                    Tidak ada data yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <SmartImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        existingSkus={existingSkus}
      />
    </div>
  );
}
