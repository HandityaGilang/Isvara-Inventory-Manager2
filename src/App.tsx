import { useEffect, useRef, useState } from "react";
import { InventoryPage } from "./features/inventory/InventoryPage";
import { ProfitCalculatorPopup } from "./features/profit/ProfitCalculatorPopup";
import { ProfitDashboardPage } from "./features/dashboard/ProfitDashboardPage";

type Tab = "inventory" | "profit";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!showSplash && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSplash]);

  if (showSplash) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Isvara Inventory Manager
          </p>
          <p className="mt-2 text-2xl font-semibold">Retail Clothing</p>
        </div>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-sky-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Isvara Inventory Manager</h1>
            <p className="text-xs text-slate-400">
              Dashboard ringan untuk inventory baju berbasis SQLite.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:w-96">
            <div className="relative">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan barcode / ketik Seller SKU..."
                className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                autoFocus
                onBlur={() => {
                  if (searchRef.current) {
                    searchRef.current.focus();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 text-[11px] text-slate-500">
              <span>Search bar selalu fokus untuk scanner barcode.</span>
            </div>
          </div>
        </header>

        <nav className="flex gap-2 rounded-lg bg-slate-900/60 p-1 text-xs">
          <button
            className={`flex-1 rounded-md px-3 py-2 font-medium ${
              activeTab === "inventory"
                ? "bg-slate-800 text-slate-50"
                : "text-slate-400 hover:bg-slate-900"
            }`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </button>
          <button
            className={`flex-1 rounded-md px-3 py-2 font-medium ${
              activeTab === "profit"
                ? "bg-slate-800 text-slate-50"
                : "text-slate-400 hover:bg-slate-900"
            }`}
            onClick={() => setActiveTab("profit")}
          >
            Profit Dashboard
          </button>
        </nav>

        <main className="pb-20">
          {activeTab === "inventory" ? (
            <InventoryPage searchQuery={search} />
          ) : (
            <ProfitDashboardPage
              estimatedProfit={2500000}
              estimatedCost={4000000}
            />
          )}
        </main>
      </div>
      <ProfitCalculatorPopup />
    </div>
  );
}

export default App;
