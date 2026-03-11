import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How This Dynasty Trade Calculator Works",
  description:
    "Learn how this dynasty fantasy football trade calculator uses age curves, positional value, projections, and VORP-style logic.",
  alternates: {
    canonical: "/how-this-calculator-works"
  }
};

export default function HowItWorksPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        How This Dynasty Trade Calculator Works
      </h1>
      <p className="max-w-2xl text-sm text-slate-600">
        Educational SEO page that will document the rank-based curve, projection
        adjustments, VORP logic, and league-setting modifiers that power every
        trade calculation on the site.
      </p>
    </div>
  );
}

