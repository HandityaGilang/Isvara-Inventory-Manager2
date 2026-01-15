type ProfitDonutChartProps = {
  profit: number;
  cost: number;
};

export function ProfitDonutChart({ profit, cost }: ProfitDonutChartProps) {
  const total = Math.max(profit + cost, 0.0001);
  const profitPercent = Math.min(Math.max((profit / total) * 100, 0), 100);

  const background = `conic-gradient(rgb(56 189 248) 0 ${profitPercent}%, rgb(148 163 184) ${profitPercent}% 100%)`;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32">
        <div
          className="h-full w-full rounded-full"
          style={{ background }}
        />
        <div className="absolute inset-3 rounded-full bg-slate-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
          <span className="text-slate-400">Profit</span>
          <span className="font-semibold text-slate-50">
            {profitPercent.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          <span className="text-slate-300">
            Profit: <span className="font-semibold">Rp{profit.toLocaleString()}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-slate-300">
            Modal: <span className="font-semibold">Rp{cost.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
