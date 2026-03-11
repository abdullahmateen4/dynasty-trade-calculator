import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynasty Trade Calculator | Dynasty Fantasy Football Values",
  description:
    "Dynasty fantasy football trade calculator with player values, league settings, and explainable trade results."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Dynasty
                </span>
                <span className="text-sm font-semibold tracking-tight md:text-base">
                  Dynasty Trade Calculator
                </span>
              </div>
              <nav className="hidden gap-5 text-xs text-slate-600 md:flex">
                <a href="/dynasty-trade-calculator" className="hover:text-slate-900">
                  Calculator
                </a>
                <a href="/nfl-player-values" className="hover:text-slate-900">
                  Player Rankings
                </a>
                <a href="/player-value-trends" className="hover:text-slate-900">
                  Value Trends
                </a>
                <a href="/about" className="hover:text-slate-900">
                  About
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
              {children}
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-slate-700">
                  Dynasty Trade Calculator
                </span>
                <span>Built for dynasty fantasy football.</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/nfl-player-values" className="hover:text-slate-800">
                  Player Rankings
                </a>
                <a href="/player-value-trends" className="hover:text-slate-800">
                  Value Trends
                </a>
                <a href="/how-this-calculator-works" className="hover:text-slate-800">
                  How It Works
                </a>
                <a href="/about" className="hover:text-slate-800">
                  About
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}