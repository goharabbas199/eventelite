import { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProfitSimulatorProps {
  totalCost: number;
}

const PRESETS = [10, 15, 20, 25, 30] as const;

export function ProfitSimulator({ totalCost }: ProfitSimulatorProps) {
  const [markup, setMarkup] = useState(20);

  const sim = useMemo(() => {
    const suggestedPrice = totalCost * (1 + markup / 100);
    const expectedProfit = suggestedPrice - totalCost;
    const profitMargin =
      suggestedPrice > 0 ? (expectedProfit / suggestedPrice) * 100 : 0;
    return { suggestedPrice, expectedProfit, profitMargin };
  }, [totalCost, markup]);

  return (
    <Card className="border border-slate-100 dark:border-slate-700 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <CardTitle className="text-base">Profit Simulator</CardTitle>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Calculate suggested pricing from your markup
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Cost base */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Cost</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            ${totalCost.toLocaleString()}
          </span>
        </div>

        {/* Markup slider */}
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
            Markup Percentage
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={markup}
              onChange={(e) => setMarkup(Number(e.target.value))}
              className="flex-1 accent-indigo-600 h-2 cursor-pointer"
              data-testid="input-markup-slider"
            />
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1 bg-slate-50 dark:bg-slate-700 min-w-[60px] justify-center">
              <Input
                type="number"
                min={0}
                max={200}
                value={markup}
                onChange={(e) => setMarkup(Math.max(0, Number(e.target.value)))}
                className="border-0 bg-transparent p-0 text-center text-sm font-bold w-10 focus-visible:ring-0"
                data-testid="input-markup-percent"
              />
              <span className="text-xs text-slate-500 font-semibold">%</span>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setMarkup(p)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                markup === p
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
              data-testid={`button-markup-preset-${p}`}
            >
              {p}%
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="border-t dark:border-slate-700 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Suggested Price</span>
            <span
              className="font-bold text-base text-indigo-600"
              data-testid="text-suggested-price"
            >
              ${Math.round(sim.suggestedPrice).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Expected Profit</span>
            <span
              className={`font-bold text-base ${sim.expectedProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
              data-testid="text-expected-profit"
            >
              ${Math.round(sim.expectedProfit).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Profit Margin</span>
            <span
              className={`font-semibold text-sm ${sim.profitMargin >= 0 ? "text-emerald-600" : "text-red-500"}`}
              data-testid="text-profit-margin"
            >
              {sim.profitMargin.toFixed(1)}%
            </span>
          </div>

          {totalCost > 0 ? (
            <div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(sim.profitMargin, 100).toFixed(1)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right">
                {sim.profitMargin.toFixed(1)}% of suggested price is profit
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">
              Add services or expenses to see calculations.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
