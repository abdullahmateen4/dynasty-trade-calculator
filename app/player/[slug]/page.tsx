import type { Metadata } from "next";

interface PlayerPageProps {
  params: { slug: string };
}

export function generateMetadata({
  params
}: PlayerPageProps): Metadata {
  const name = params.slug.replace(/-/g, " ");
  return {
    title: `${name} Dynasty Value | Dynasty Trade Calculator`,
    description: `Dynasty fantasy football player value, trends, and trade outlook for ${name}.`,
    alternates: {
      canonical: `/player/${params.slug}`
    }
  };
}

export default function PlayerPage({ params }: PlayerPageProps) {
  const readableName = params.slug.replace(/-/g, " ");

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        {readableName} Dynasty Value
      </h1>
      <p className="max-w-2xl text-sm text-slate-600">
        Player-specific SEO page for dynasty value, historical movement, and trade
        evaluation notes. This will hydrate from Supabase and Recharts with
        monthly value history.
      </p>
    </div>
  );
}

