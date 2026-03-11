import type { Metadata } from "next";
import Calculator from "./Calculator";

export const metadata: Metadata = {
  title: "Dynasty Trade Calculator | Dynasty Fantasy Football Tool",
  description:
    "Dynasty fantasy football trade calculator with explainable player values, league settings, and trade fairness scoring."
};

export default function DynastyTradeCalculatorPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Dynasty Trade Calculator
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Analyze dynasty trades with explainable player value.
        </h1>

        <p className="mx-auto max-w-2xl text-sm text-slate-600">
          A clean, mobile-first dynasty fantasy football trade calculator that
          blends player age, positional value, league format, and VORP-style
          logic into one score. Start by choosing your league settings, then add
          players to each side of the trade.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-card md:p-6">
        <Calculator />
      </section>

      <section className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-600">
        <span className="text-slate-500">Explore more:</span>
        <a
          href="/nfl-player-values"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          Player Rankings
        </a>
        <a
          href="/player-value-trends"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          Value Trends
        </a>
        <a
          href="/how-this-calculator-works"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          How This Calculator Works
        </a>
        <a
          href="/about"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          About
        </a>
      </section>
    </div>
  );
}