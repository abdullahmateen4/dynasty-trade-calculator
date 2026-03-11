import type { Metadata } from "next";
import Calculator from "./Calculator";

export const metadata: Metadata = {
  title: "Dynasty Trade Calculator | Dynasty Fantasy Football Tool",
  description:
    "Dynasty fantasy football trade calculator with explainable player values, league settings, and trade fairness scoring."
};

export default function DynastyTradeCalculatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-slate-500">
          Dynasty Trade Calculator
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Analyze dynasty trades with explainable player value.
        </h1>

        <p className="max-w-2xl text-sm text-slate-600">
          Mobile-first dynasty fantasy football trade calculator that blends age
          curves, positional value, and VORP-style adjustments into one clean
          value score. Start by setting your league format and adding players to
          each side of the trade.
        </p>
      </section>

      <Calculator />
    </div>
  );
}