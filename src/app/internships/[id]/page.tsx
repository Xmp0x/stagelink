"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InternshipDetail {
  id: string;
  title: string;
  department?: string | null;
  sector: string;
  city: string;
  modality: "REMOTE" | "ONSITE" | "HYBRID";
  durationWeeks: number;
  startMonth?: string | null;
  deadlineDate: string;
  openPositions: number;
  description: string;
  requirements?: string | null;
  isPaid: boolean;
  stipendAmount?: number | null;
  company: {
    id: string;
    legalName: string;
    sector: string;
    city: string;
    website?: string | null;
    description?: string | null;
    status: string;
  };
  skills: Array<{
    id: string;
    isRequired: boolean;
    skill: { name: string };
  }>;
}

export default function InternshipDetailPage() {
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = React.useState<InternshipDetail | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);
  const [hasApplied, setHasApplied] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [savingAction, setSavingAction] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadListing() {
      try {
        const res = await fetch(`/api/internships/${listingId}`);
        const body = await res.json();
        if (res.ok && body.success) {
          setListing(body.data.listing);
          setIsSaved(body.data.meta?.isSaved || false);
          setHasApplied(body.data.meta?.hasApplied || false);
        } else {
          setError(body.error?.message || "Opportunity not found or no longer active.");
        }
      } catch {
        setError("Failed to load internship details.");
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [listingId]);

  const toggleSave = async () => {
    setSavingAction(true);
    try {
      const method = isSaved ? "DELETE" : "POST";
      const res = await fetch(`/api/me/saved/${listingId}`, { method });
      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } catch {
      // Ignore
    } finally {
      setSavingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-16 max-w-4xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading verified internship opportunity...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container py-16 max-w-4xl text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Opportunity Unavailable</h2>
        <p className="text-sm text-muted-foreground">{error || "This listing could not be found."}</p>
        <Link href="/internships">
          <Button variant="outline" size="sm">
            Back to All Internships
          </Button>
        </Link>
      </div>
    );
  }

  const requiredSkills = listing.skills.filter((s) => s.isRequired);
  const preferredSkills = listing.skills.filter((s) => !s.isRequired);

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Link href="/internships" className="text-xs font-semibold text-primary-600 hover:underline">
          ← Back to Search
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={toggleSave}
            isLoading={savingAction}
          >
            {isSaved ? "★ Saved" : "☆ Save Listing"}
          </Button>
          {hasApplied ? (
            <Badge variant="success" className="px-3 py-1.5 text-xs font-semibold">
              ✓ Applied
            </Badge>
          ) : (
            <Link href={`/internships/${listing.id}/apply`}>
              <Button size="sm">Apply Now</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border p-8 rounded-xl shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-primary-700">{listing.company.legalName}</span>
            <Badge variant="success" className="text-xs flex items-center gap-1">
              <span>✓ Verified Organization</span>
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{listing.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Department: {listing.department || "General"} • Posted in {listing.city}, Morocco
          </p>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 border border-border text-xs">
          <div>
            <span className="text-muted-foreground block">Modality</span>
            <strong className="text-foreground text-sm">{listing.modality}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">Duration</span>
            <strong className="text-foreground text-sm">{listing.durationWeeks} Weeks</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">Compensation</span>
            <strong className="text-foreground text-sm">
              {listing.isPaid ? `${listing.stipendAmount || 0} MAD/mo` : "Unpaid (Academic)"}
            </strong>
          </div>
          <div>
            <span className="text-muted-foreground block">Application Deadline</span>
            <strong className="text-rose-600 text-sm">
              {new Date(listing.deadlineDate).toLocaleDateString()}
            </strong>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-1">
            Internship Overview & Objectives
          </h2>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {listing.description}
          </div>
        </div>

        {/* Requirements */}
        {listing.requirements && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground border-b border-border pb-1">
              Candidate Requirements
            </h2>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {listing.requirements}
            </div>
          </div>
        )}

        {/* Required Skills */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-1">
            Required Technical & Professional Skills
          </h2>
          {requiredSkills.length === 0 ? (
            <p className="text-xs text-muted-foreground">No specific required skills listed.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((s) => (
                <span
                  key={s.id}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-800 border border-primary-200"
                >
                  {s.skill.name} *
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Skills */}
        {preferredSkills.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground border-b border-border pb-1">
              Preferred (Bonus) Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {preferredSkills.map((s) => (
                <span
                  key={s.id}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border"
                >
                  {s.skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About Company */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="text-base font-bold text-foreground">About {listing.company.legalName}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {listing.company.description ||
              `${listing.company.legalName} is a verified Moroccan employer in the ${listing.company.sector} sector located in ${listing.company.city}.`}
          </p>
          {listing.company.website && (
            <a
              href={listing.company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline font-medium inline-block"
            >
              Visit Company Website ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
