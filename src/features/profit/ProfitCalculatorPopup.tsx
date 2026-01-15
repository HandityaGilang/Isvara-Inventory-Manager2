import { useMemo, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type Numbers = {
  cost: number;
  listingPrice: number;
  discountPercent: number;
};

function parse(value: string) {
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) {
    return 0;
  }
  return n;
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "Rp0";
  }
  return `Rp${Math.max(value, 0).toLocaleString("id-ID")}`;
}

function compute(values: Numbers) {
  const listing = values.listingPrice;
  const discountFactor = 1 - values.discountPercent / 100;
  const finalPrice = listing * discountFactor;

  const zaloraNet = finalPrice * (1 - 0.13);
  const shopeeNet = finalPrice * (1 - 0.054);

  const zaloraProfit = zaloraNet - values.cost;
  const shopeeProfit = shopeeNet - values.cost;

  return {
    finalPrice,
    zaloraNet,
    shopeeNet,
    zaloraProfit,
    shopeeProfit,
  };
}

export function ProfitCalculatorPopup() {
  const [open, setOpen] = useState(true);
  const [costInput, setCostInput] = useState("");
  const [listingInput, setListingInput] = useState("");
  const [discountInput, setDiscountInput] = useState("0");

  const numbers = useMemo<Numbers>(
    () => ({
      cost: parse(costInput),
      listingPrice: parse(listingInput),
      discountPercent: parse(discountInput),
    }),
    [costInput, listingInput, discountInput],
  );

  const result = useMemo(() => compute(numbers), [numbers]);

  if (!open) {
    return (
      <div className="pointer-events-none fixed bottom-4 right-4 z-40">
        <button
          className="pointer-events-auto rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-slate-50 shadow-md shadow-slate-900/50 hover:bg-slate-800"
          onClick={() => setOpen(true)}
        >
          Buka Kalkulator Profit
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 max-w-xs">
      <Card className="pointer-events-auto w-full max-w-xs space-y-3 bg-slate-950/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-100">
              Kalkulator Diskon & Profit
            </p>
            <p className="text-[11px] text-slate-400">
              Sesuai komisi Zalora 13% dan Shopee 5.4%
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px]"
            onClick={() => setOpen(false)}
          >
            Sembunyi
          </Button>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="space-y-1">
            <p className="text-slate-300">Modal per item</p>
            <Input
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              placeholder="Contoh: 75000"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <p className="text-slate-300">Recommended Listing Price</p>
            <Input
              value={listingInput}
              onChange={(e) => setListingInput(e.target.value)}
              placeholder="Contoh: 129000"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <p className="text-slate-300">Diskon (%)</p>
            <Input
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Contoh: 10"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-2 text-[11px]">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Setelah Diskon
            </p>
            <p className="text-xs font-semibold text-slate-50">
              {formatCurrency(result.finalPrice)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Diskon
            </p>
            <p className="text-xs font-semibold text-slate-50">
              {numbers.discountPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="space-y-1 rounded-lg bg-slate-900 p-2">
            <p className="text-[10px] font-semibold text-sky-300">
              Zalora (13%)
            </p>
            <p className="text-[10px] text-slate-400">Nett Receive</p>
            <p className="text-xs font-semibold text-slate-50">
              {formatCurrency(result.zaloraNet)}
            </p>
            <p className="text-[10px] text-slate-400">Perkiraan Profit</p>
            <p className="text-xs font-semibold text-sky-300">
              {formatCurrency(result.zaloraProfit)}
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-900 p-2">
            <p className="text-[10px] font-semibold text-emerald-300">
              Shopee (5.4%)
            </p>
            <p className="text-[10px] text-slate-400">Nett Receive</p>
            <p className="text-xs font-semibold text-slate-50">
              {formatCurrency(result.shopeeNet)}
            </p>
            <p className="text-[10px] text-slate-400">Perkiraan Profit</p>
            <p className="text-xs font-semibold text-emerald-300">
              {formatCurrency(result.shopeeProfit)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

