"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Building2,
  Clock,
  Briefcase,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface MatchItem {
  internship: {
    id: string;
    title: string;
    sector: string;
    city: string;
    modality: string;
    durationWeeks: number;
    deadlineDate: string;
    isPaid: boolean;
    stipendAmount?: number | null;
    company: {
      id: string;
      name: string;
      city: string;
    };
    skills: Array<{ name: string; isRequired: boolean }>;
  };
  evaluation: {
    score: number;
    scoreVersion: string;
    isEligible: boolean;
    matchFactors: {
      matchedRequiredSkills: string[];
      matchedPreferredSkills: string[];
      skillsScore: number;
      educationScore: number;
      locationScore: number;
      fieldScore: number;
      durationScore: number;
      languageScore: number;
      locationFit: string;
      educationFit: string;
      fieldFit: string;
    };
    missingFactors: {
      missingRequiredSkills: string[];
      missingPreferredSkills: string[];
      ineligibilityReasons: string[];
    };
    summary: string;
    disclaimer: string;
  };
}

export default function StudentMatchesPage() {
  const [matches, setMatches] = React.useState<MatchItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/me/matches");
        const body = await res.json();
        if (body.success && body.data?.matches) {
          setMatches(body.data.matches);
        } else {
          setError(body.error?.message || "Failed to load matching recommendations.");
        }
      } catch {
        setError("Network error while connecting to matching engine.");
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Personalized Recommendations
            </h1>
            <Badge variant="accent" className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              Engine v1.0.0
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Deterministic, explainable compatibility matching based on verified database records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/internships">
            <Button variant="outline" size="sm">
              Explore All Listings
            </Button>
          </Link>
          <Link href="/student/profile">
            <Button size="sm">Update Skills & CV</Button>
          </Link>
        </div>
      </div>

      {/* Explicit Disclaimer Alert */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="font-semibold">Explainability & Compliance Notice</p>
          <p className="mt-0.5 opacity-90">
            Compatibility heuristic, not an employment guarantee. Scores are calculated transparently
            from required skills, education, location fit, and work modality. Hard requirements must be
            satisfied for candidate eligibility.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <Link href="/student/profile">
            <Button size="sm" variant="outline">
              Complete Your Profile
            </Button>
          </Link>
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No Matching Offers Found Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            As verified Moroccan employers publish active internships matching your skills and
            education, they will be ranked here automatically.
          </p>
          <Link href="/internships">
            <Button size="sm" variant="outline">
              Browse Public Search Engine
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {matches.length} ranked opportunities</span>
            <span>Sorted by Eligibility & Compatibility Score</span>
          </div>

          <div className="space-y-6">
            {matches.map(({ internship, evaluation }) => {
              const { isEligible, score, matchFactors, missingFactors, summary } = evaluation;

              return (
                <div
                  key={internship.id}
                  className={`rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${
                    isEligible ? "border-border" : "border-amber-500/40 bg-amber-500/5"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Main Listing Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-primary-700 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {internship.company.name}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {internship.city} ({internship.modality})
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {internship.durationWeeks} weeks
                        </span>
                        {internship.isPaid && (
                          <Badge variant="accent" className="text-[10px] py-0 px-2">
                            Paid / Stipend
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-lg font-bold text-foreground">
                        <Link
                          href={`/internships/${internship.id}`}
                          className="hover:text-primary-700 transition-colors"
                        >
                          {internship.title}
                        </Link>
                      </h2>

                      {/* Summary explanation */}
                      <p className="text-xs text-muted-foreground">{summary}</p>

                      {/* Evidence Breakdown Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Skills factor */}
                        <div className="rounded-lg border border-border/70 bg-background/50 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-foreground">
                              <Briefcase className="h-3.5 w-3.5 text-primary-600" />
                              Required Skills Alignment
                            </span>
                            <span className="text-muted-foreground">
                              {matchFactors.skillsScore}/35 pts
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {matchFactors.matchedRequiredSkills.map((s) => (
                              <Badge
                                key={s}
                                variant="default"
                                className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] py-0"
                              >
                                ✓ {s}
                              </Badge>
                            ))}
                            {missingFactors.missingRequiredSkills.map((s) => (
                              <Badge
                                key={s}
                                variant="destructive"
                                className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] py-0"
                              >
                                ✕ {s} (Required)
                              </Badge>
                            ))}
                            {matchFactors.matchedPreferredSkills.map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="border-primary-500/30 text-primary-700 text-[10px] py-0"
                              >
                                + {s} (Preferred)
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Location & Education factor */}
                        <div className="rounded-lg border border-border/70 bg-background/50 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-foreground">
                              <GraduationCap className="h-3.5 w-3.5 text-primary-600" />
                              Curriculum & Location Fit
                            </span>
                            <span className="text-muted-foreground">
                              {matchFactors.locationScore + matchFactors.educationScore}/30 pts
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] text-muted-foreground">
                            <p className="flex items-center gap-1">
                              <span className="text-primary-700 font-medium">Curriculum:</span>{" "}
                              {matchFactors.educationFit}
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="text-primary-700 font-medium">Location:</span>{" "}
                              {matchFactors.locationFit}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score Gauge & Action CTAs */}
                    <div className="flex flex-col items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                      <div className="text-center lg:text-right space-y-1">
                        <div className="flex items-baseline justify-center lg:justify-end gap-1">
                          <span className="text-3xl font-extrabold text-foreground">{score}%</span>
                          <span className="text-xs text-muted-foreground">fit</span>
                        </div>
                        {isEligible ? (
                          <Badge
                            variant="default"
                            className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30 text-xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Eligible Candidate
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="text-xs flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Not Eligible
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col w-full gap-2">
                        {isEligible ? (
                          <Link href={`/internships/${internship.id}/apply`}>
                            <Button size="sm" className="w-full flex items-center justify-center gap-1.5">
                              Apply Now
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/internships/${internship.id}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              View Requirements
                            </Button>
                          </Link>
                        )}
                        <Link href={`/internships/${internship.id}`}>
                          <Button size="sm" variant="ghost" className="w-full text-xs">
                            Listing Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
