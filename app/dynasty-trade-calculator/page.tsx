import type { Metadata } from "next";
import Calculator from "./Calculator";

export const metadata: Metadata = {
  title: "Dynasty Trade Calculator | Dynasty Fantasy Football Tool",
  description:
    "Dynasty fantasy football trade calculator with explainable player values, league settings, and trade fairness scoring."
};

export default function DynastyTradeCalculatorPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="space-y-1.5 text-center pb-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          Analyze dynasty trades with explainable player value
        </h1>
        <p className="mx-auto max-w-xl text-xs text-slate-600">
          Add players to each side, set league format, and compare values.
        </p>
      </section>

      <section className="rounded-xl border-2 border-slate-300 bg-white p-3 shadow-lg md:p-4">
        <Calculator />
      </section>
    </div>
  );
}