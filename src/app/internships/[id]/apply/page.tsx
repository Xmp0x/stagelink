"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InternshipSummary {
  id: string;
  title: string;
  city: string;
  modality: string;
  deadlineDate: string;
  company: {
    legalName: string;
    city: string;
  };
}

interface CVInfo {
  id: string;
  filename: string;
}

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = React.useState<InternshipSummary | null>(null);
  const [activeCv, setActiveCv] = React.useState<CVInfo | null>(null);
  const [coverNote, setCoverNote] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [listingRes, profileRes] = await Promise.all([
          fetch(`/api/internships/${listingId}`),
          fetch("/api/me/profile"),
        ]);

        const listingBody = await listingRes.json();
        const profileBody = await profileRes.json();

        if (listingRes.ok && listingBody.success) {
          setListing(listingBody.data.listing);
        } else {
          setError(listingBody.error?.message || "Internship not found.");
        }

        if (profileRes.ok && profileBody.success) {
          const cvs = profileBody.data.profile.cvDocuments;
          if (cvs && cvs.length > 0) {
            setActiveCv(cvs[0]);
          }
        }
      } catch {
        setError("Failed to load application data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setError("You must explicitly confirm before submitting your application.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/internships/${listingId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverNote: coverNote || null,
          cvDocumentId: activeCv?.id || null,
          explicitConfirmation: true,
        }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        router.push("/student/applications?applied=true");
      } else {
        setError(body.error?.message || "Failed to submit application.");
      }
    } catch {
      setError("Network error submitting application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-16 max-w-2xl text-center">
        <div className="animate-pulse text-muted-foreground">Preparing application submission...</div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="container py-16 max-w-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Cannot Submit Application</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/internships">
          <Button variant="outline" size="sm">
            Back to Internships
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl space-y-8">
      <div className="border-b border-border pb-4">
        <Link href={`/internships/${listingId}`} className="text-xs font-semibold text-primary-600 hover:underline">
          ← Back to Opportunity
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">
          Apply to {listing?.company.legalName}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Position: <strong className="text-foreground">{listing?.title}</strong> ({listing?.city} • {listing?.modality})
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6">
        {/* CV Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Curriculum Vitae (PDF)
          </label>
          {activeCv ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 text-xs">
              <div>
                <span className="font-semibold block text-foreground">📄 {activeCv.filename}</span>
                <span className="text-muted-foreground">Attached from your private CV vault</span>
              </div>
              <Badge variant="success">Active Version</Badge>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20 text-xs space-y-2">
              <p className="text-muted-foreground">You haven&apos;t uploaded a CV to your profile yet.</p>
              <Link href="/student/cv">
                <Button size="sm" variant="outline">
                  Upload PDF CV
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Cover Note */}
        <div className="space-y-1.5">
          <label htmlFor="coverNote" className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Motivation / Message to Employer (Optional)
          </label>
          <textarea
            id="coverNote"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Introduce yourself, mention your relevant coursework or projects, and explain why you're a good fit..."
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
          />
        </div>

        {/* Explicit Confirmation Notice */}
        <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <input
              id="confirmConsent"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirmConsent" className="text-xs text-foreground leading-relaxed cursor-pointer">
              <span className="font-semibold block text-primary-900 mb-0.5">
                Explicit Application Confirmation
              </span>
              I confirm that I want to submit my candidate profile and CV to{" "}
              <strong>{listing?.company.legalName}</strong> for the <strong>{listing?.title}</strong> opportunity.
              I understand that submitting this application authorizes {listing?.company.legalName} to view my profile
              and download my uploaded CV in accordance with Moroccan Law 09-08.
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={`/internships/${listingId}`}>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="sm" isLoading={submitting} disabled={!confirmed}>
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
