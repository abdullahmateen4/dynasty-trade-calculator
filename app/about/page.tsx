import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About This Dynasty Trade Calculator",
  description:
    "Background, philosophy, and roadmap for this dynasty fantasy football trade calculator project.",
  alternates: {
    canonical: "/about"
  }
};

export default function AboutPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        About This Project
      </h1>
      <p className="max-w-2xl text-sm text-slate-600">
        This SEO-friendly about page will outline the goals of the dynasty trade
        calculator, the methodology behind value calculations, and the roadmap
        for future features like AI trade suggestions and public trade sharing.
      </p>
    </div>
  );
}

