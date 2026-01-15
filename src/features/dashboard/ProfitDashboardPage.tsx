import { Card } from "../../components/ui/card";
import { ProfitDonutChart } from "../profit/ProfitDonutChart";

type ProfitDashboardPageProps = {
  estimatedProfit: number;
  estimatedCost: number;
};

export function ProfitDashboardPage({
  estimatedProfit,
  estimatedCost,
}: ProfitDashboardPageProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="flex flex-col justify-between bg-slate-950/80">
        <p className="text-xs text-slate-400">Total SKU</p>
        <p className="text-2xl font-semibold text-slate-50">0</p>
        <p className="text-[11px] text-slate-500">
          Akan diambil dari database inventory.
        </p>
      </Card>
      <Card className="flex flex-col justify-between bg-slate-950/80">
        <p className="text-xs text-slate-400">Total Barang</p>
        <p className="text-2xl font-semibold text-slate-50">0</p>
        <p className="text-[11px] text-slate-500">
          Menghitung total quantity dari semua size.
        </p>
      </Card>
      <Card className="flex flex-col justify-between bg-slate-950/80">
        <p className="text-xs text-slate-400">Estimasi Profit</p>
        <p className="text-2xl font-semibold text-sky-300">
          Rp{estimatedProfit.toLocaleString("id-ID")}
        </p>
        <p className="text-[11px] text-slate-500">
          Contoh perhitungan awal, nanti dihubungkan dengan data asli.
        </p>
      </Card>
      <Card className="md:col-span-3 bg-slate-950/80">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Profit Overview
            </p>
            <p className="text-[11px] text-slate-400">
              Donut chart untuk gambaran cepat antara modal dan profit.
            </p>
          </div>
        </div>
        <ProfitDonutChart profit={estimatedProfit} cost={estimatedCost} />
      </Card>
    </div>
  );
}

