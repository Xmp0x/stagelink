"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VerificationItem {
  id: string;
  registrationNumber?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewerNotes?: string | null;
  createdAt: string;
  company: {
    id: string;
    legalName: string;
    sector: string;
    city: string;
    website?: string | null;
    status: string;
    createdAt: string;
    memberships: Array<{
      user: { email: string };
      role: string;
    }>;
  };
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = React.useState<VerificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/verifications");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setVerifications(body.data.verifications);
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load verifications queue." });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecision = async (
    verificationId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    const reviewerNotes = window.prompt(
      decision === "APPROVED"
        ? "Enter approval note (e.g. 'OMPIC verified'):"
        : "Enter reason for rejection (mandatory):"
    );

    if (!reviewerNotes || reviewerNotes.trim().length < 3) {
      alert("A review note of at least 3 characters is required.");
      return;
    }

    setActionLoading(verificationId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/verifications/${verificationId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewerNotes: reviewerNotes.trim() }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setMessage({
          type: "success",
          text: `Company ${decision.toLowerCase()} successfully.`,
        });
        fetchQueue();
      } else {
        setMessage({ type: "error", text: body.error?.message || "Failed to submit decision." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error submitting decision." });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-5xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading verification queue...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Company Verification Queue</h1>
            <Badge variant="destructive" className="text-xs uppercase">
              Admin Restricted
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review submitted registration numbers and audit verification trails.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm">
            Admin Overview
          </Button>
        </Link>
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

      {verifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No verification requests pending review.
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-foreground">{item.company.legalName}</h3>
                  <Badge
                    variant={
                      item.status === "APPROVED"
                        ? "success"
                        : item.status === "REJECTED"
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-semibold text-foreground/80">Location:</span> {item.company.city} •{" "}
                    <span className="font-semibold text-foreground/80">Sector:</span> {item.company.sector}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground/80">Registration (RC/ICE):</span>{" "}
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                      {item.registrationNumber || "Not provided"}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground/80">Submitted:</span>{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {item.reviewerNotes && (
                    <p className="italic text-foreground/75">Notes: {item.reviewerNotes}</p>
                  )}
                </div>
              </div>

              {item.status === "PENDING" && (
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="accent"
                    isLoading={actionLoading === item.id}
                    onClick={() => handleDecision(item.id, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    isLoading={actionLoading === item.id}
                    onClick={() => handleDecision(item.id, "REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
