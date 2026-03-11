import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dynasty Player Value Trends | Dynasty Trade Calculator",
  description:
    "Track monthly dynasty player value movement with trend graphs powered by Recharts.",
  alternates: {
    canonical: "/player-value-trends"
  }
};

export default function PlayerValueTrendsPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        Dynasty Player Value Trends
      </h1>
      <p className="max-w-2xl text-sm text-slate-600">
        This page will host player value trend charts using Recharts, driven by
        the monthly history stored in Supabase. It supports SEO for long-tail
        searches around dynasty value movement and market sentiment.
      </p>
    </div>
  );
}

