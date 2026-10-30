import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-background to-background py-20 md:py-32 border-b border-border">
        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="default" className="text-xs px-3 py-1 font-semibold uppercase tracking-wider">
              🇲🇦 Morocco-First Platform
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Verified Listings Only • Zero Scraped Jobs
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight md:leading-none">
            The Verified Bridge Between{" "}
            <span className="text-primary-600">Moroccan Students</span> and{" "}
            <span className="text-accent-emerald">Real Companies</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Build your professional profile, parse your CV securely, and find verified internships with explainable matching and an AI copilot that respects your consent.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 bg-primary-600 hover:bg-primary-700 text-white font-semibold">
                Find Your Internship
              </Button>
            </Link>
            <Link href="/register?role=COMPANY" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                Recruit Verified Interns
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              100% Internal Database
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Law 09-08 Privacy First
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified Company Badges
            </span>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Built for Trust, Privacy & Real Outcomes
            </h2>
            <p className="mt-3 text-muted-foreground">
              StageLink rejects fake offers and scraper noise. Every opportunity is posted by a vetted company with an audited verification trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold mb-4">
                01
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Secure Private CV Parsing
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload your PDF CV directly to private storage. Our parser extracts education, skills, and projects, presenting a clear diff for you to review and confirm before anything updates.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent-50 flex items-center justify-center text-accent-emerald font-bold mb-4">
                02
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Explainable Heuristic Matching
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Never wonder why an offer was recommended. Our matching engine breaks down skills overlap, location alignment, and requirements, providing clear evidence for every match.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold mb-4">
                03
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sandboxed AI Internship Copilot
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask our AI assistant to search active internships, draft cover notes, and analyze requirements. It operates strictly within our verified database and never submits without your explicit confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
