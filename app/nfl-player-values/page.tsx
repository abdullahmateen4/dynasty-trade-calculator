import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NFL Dynasty Player Values | Dynasty Trade Calculator",
  description:
    "View dynasty fantasy football player values, rankings, and market movement for NFL players.",
  alternates: {
    canonical: "/nfl-player-values"
  }
};

export default function NflPlayerValuesPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        NFL Dynasty Player Values
      </h1>
      <p className="max-w-2xl text-sm text-slate-600">
        SEO-friendly index of dynasty fantasy football player values. This page
        will list player value tiers, positional rankings, and filters once
        Supabase and the NFL data API are wired up.
      </p>
    </div>
  );
}

