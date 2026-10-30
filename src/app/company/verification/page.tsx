"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CompanyData {
  id: string;
  legalName: string;
  sector: string;
  city: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  verifications?: Array<{
    id: string;
    registrationNumber?: string | null;
    status: string;
    reviewerNotes?: string | null;
    createdAt: string;
  }>;
}

export default function CompanyVerificationPage() {
  const [company, setCompany] = React.useState<CompanyData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCompany = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const body = await res.json();
        const primaryCompany = body.data?.user?.companyMemberships?.[0]?.company;
        if (primaryCompany) {
          const compRes = await fetch(`/api/companies/${primaryCompany.id}`);
          if (compRes.ok) {
            const compBody = await compRes.json();
            setCompany(compBody.data.company);
          }
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/companies/${company.id}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: registrationNumber.trim() }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setMessage({
          type: "success",
          text: "Verification documents submitted successfully! Our compliance team will review your organization.",
        });
        fetchCompany();
      } else {
        setMessage({ type: "error", text: body.error?.message || "Failed to submit verification request." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error submitting verification." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-3xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading organization status...</div>
      </div>
    );
  }

  const isVerified = company?.status === "VERIFIED";

  return (
    <div className="container py-8 max-w-3xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Required to publish internship offers and access candidate discovery.
          </p>
        </div>
        <Link href="/company/dashboard">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Status Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{company?.legalName || "Your Company"}</h2>
            <p className="text-xs text-muted-foreground">{company?.city} • {company?.sector}</p>
          </div>
          <Badge
            variant={
              isVerified
                ? "success"
                : company?.status === "REJECTED"
                ? "destructive"
                : "warning"
            }
            className="text-xs font-bold uppercase tracking-wider"
          >
            {company?.status?.replace("_", " ") || "UNVERIFIED"}
          </Badge>
        </div>

        {isVerified ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 leading-relaxed">
            <span className="font-semibold block mb-1">🎉 Your organization is verified!</span>
            Your verified badge is active on all published internship listings. You have full permission to publish opportunities and discover opted-in Moroccan candidates.
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold block mb-1">Why is verification mandatory?</span>
            To maintain zero scams on StageLink, all employers must verify their Moroccan legal registration (Registre du Commerce or Identifiant Commun de l&apos;Entreprise - ICE) before listings are visible to students.
          </div>
        )}
      </div>

      {message && (
        <div
          className={`rounded-md p-4 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submission Form (Only if not verified) */}
      {!isVerified && (
        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6">
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
            Submit Business Identification
          </h3>

          <Input
            id="registrationNumber"
            label="Moroccan Business Registration (RC / ICE Number)"
            required
            placeholder="e.g. ICE 001234567890001 or RC 45892"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
          />

          <p className="text-xs text-muted-foreground leading-relaxed">
            Our platform administrators verify registration numbers against the official Moroccan commercial directory (OMPIC). Reviews typically take 1-2 business days.
          </p>

          <Button type="submit" isLoading={submitting} className="w-full">
            Submit for Verification
          </Button>
        </form>
      )}
    </div>
  );
}
