"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  MapPin,
  Briefcase,
  ShieldCheck,
  Building2,
  ShieldAlert,
} from "lucide-react";

interface ListingOption {
  id: string;
  title: string;
  status: string;
  city: string;
  modality: string;
}

interface CandidateResult {
  candidate: {
    id: string;
    name: string;
    city: string | null;
    fieldPreference: string | null;
    headline: string | null;
    education: Array<{
      school: string;
      degree: string;
      fieldOfStudy?: string | null;
    }>;
    skills: string[];
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

export default function CompanyCandidateDiscoveryPage() {
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listings, setListings] = React.useState<ListingOption[]>([]);
  const [selectedListingId, setSelectedListingId] = React.useState<string>("");
  const [candidates, setCandidates] = React.useState<CandidateResult[]>([]);
  const [loadingListings, setLoadingListings] = React.useState(true);
  const [loadingCandidates, setLoadingCandidates] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 1. Fetch user membership & active listings
  React.useEffect(() => {
    async function initCompany() {
      try {
        setLoadingListings(true);
        const meRes = await fetch("/api/auth/me");
        const meBody = await meRes.json();
        const cid = meBody.data?.user?.companyId;

        if (!cid) {
          setError("No organization profile found for your account.");
          return;
        }

        setCompanyId(cid);

        const listingsRes = await fetch(`/api/companies/${cid}/internships`);
        const listingsBody = await listingsRes.json();

        if (listingsBody.success && listingsBody.data?.internships) {
          const published = listingsBody.data.internships.filter(
            (l: ListingOption) => l.status === "PUBLISHED"
          );
          setListings(published);
          if (published.length > 0) {
            setSelectedListingId(published[0].id);
          }
        }
      } catch {
        setError("Failed to initialize organization listings.");
      } finally {
        setLoadingListings(false);
      }
    }

    initCompany();
  }, []);

  // 2. Fetch candidates when selectedListingId changes
  React.useEffect(() => {
    if (!companyId || !selectedListingId) return;

    async function fetchCandidates() {
      try {
        setLoadingCandidates(true);
        setError(null);
        const res = await fetch(
          `/api/companies/${companyId}/candidates?internshipId=${selectedListingId}`
        );
        const body = await res.json();

        if (body.success && body.data?.candidates) {
          setCandidates(body.data.candidates);
        } else {
          setError(body.error?.message || "Failed to discover candidates.");
        }
      } catch {
        setError("Network error while discovering candidates.");
      } finally {
        setLoadingCandidates(false);
      }
    }

    fetchCandidates();
  }, [companyId, selectedListingId]);

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Candidate Discovery
            </h1>
            <Badge variant="accent" className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              Engine v1.0.0
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Discover verified Moroccan students matching your specific internship requirements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/company/listings">
            <Button variant="outline" size="sm">
              Manage Listings
            </Button>
          </Link>
          <Link href="/company/applications">
            <Button size="sm">Application ATS</Button>
          </Link>
        </div>
      </div>

      {/* Privacy Notice (Law 09-08) */}
      <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4 text-primary-950 dark:text-primary-100 text-xs flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary-600 mt-0.5" />
        <div>
          <p className="font-semibold">Privacy & Consent Enforced (Moroccan Law 09-08)</p>
          <p className="mt-0.5 opacity-90">
            Candidate discovery strictly displays students who have granted explicit discoverability consent.
            Private CV documents remain restricted until candidates apply directly to your organization.
          </p>
        </div>
      </div>

      {loadingListings ? (
        <div className="h-40 rounded-xl border border-border bg-card animate-pulse" />
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No Active Published Listings</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Candidate discovery matches talent against specific active opportunities. You must have at least one
            published and verified internship listing to search for candidates.
          </p>
          <Link href="/company/listings">
            <Button size="sm">Create or Publish a Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Listing Selector Bar */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label htmlFor="listing-selector" className="text-xs font-semibold text-foreground">
                Target Active Listing:
              </label>
              <p className="text-xs text-muted-foreground">
                Candidates are ranked by compatibility with the selected position.
              </p>
            </div>
            <select
              id="listing-selector"
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.city} - {l.modality})
                </option>
              ))}
            </select>
          </div>

          {/* Results Area */}
          {loadingCandidates ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse p-6" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-destructive">{error}</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">No Consented Candidates Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No discoverable students have currently opted into search matching this role&apos;s criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Found {candidates.length} discoverable talent profiles</span>
                <span className="flex items-center gap-1 text-primary-700 font-medium">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Compatibility heuristic, not an employment guarantee
                </span>
              </div>

              <div className="space-y-4">
                {candidates.map(({ candidate, evaluation }) => {
                  const { isEligible, score, matchFactors, missingFactors, summary } = evaluation;

                  return (
                    <div
                      key={candidate.id}
                      className={`rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${
                        isEligible ? "border-border" : "border-amber-500/40 bg-amber-500/5"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        {/* Profile Info */}
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-foreground">
                              {candidate.name}
                            </h3>
                            {candidate.city && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {candidate.city}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/40 text-emerald-700 bg-emerald-500/5">
                              Consented Candidate
                            </Badge>
                          </div>

                          {candidate.headline && (
                            <p className="text-xs text-muted-foreground">{candidate.headline}</p>
                          )}

                          {/* Education Snippet */}
                          {candidate.education && candidate.education.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                              <GraduationCap className="h-3.5 w-3.5 text-primary-600 shrink-0" />
                              <span>
                                {candidate.education[0].degree} — {candidate.education[0].school} (
                                {candidate.education[0].fieldOfStudy || "Engineering"})
                              </span>
                            </div>
                          )}

                          {/* Match Factors summary */}
                          <p className="text-xs text-muted-foreground">{summary}</p>

                          {/* Skills tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
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
                                className="text-[10px] py-0"
                              >
                                ✕ Missing {s}
                              </Badge>
                            ))}
                            {matchFactors.matchedPreferredSkills.map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="border-primary-500/30 text-primary-700 text-[10px] py-0"
                              >
                                + {s}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Compatibility Score */}
                        <div className="flex flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 min-w-[170px]">
                          <div className="text-center md:text-right space-y-1">
                            <div className="flex items-baseline justify-center md:justify-end gap-1">
                              <span className="text-3xl font-extrabold text-foreground">{score}%</span>
                              <span className="text-xs text-muted-foreground">match</span>
                            </div>
                            {isEligible ? (
                              <Badge
                                variant="default"
                                className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30 text-[11px] flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Meets Criteria
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[11px] flex items-center gap-1"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Criteria Gaps
                              </Badge>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">
                              {matchFactors.locationFit}
                            </span>
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
      )}
    </div>
  );
}
