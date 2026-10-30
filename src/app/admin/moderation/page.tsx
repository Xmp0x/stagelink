"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PendingListing {
  id: string;
  title: string;
  department?: string | null;
  sector: string;
  city: string;
  modality: string;
  durationWeeks: number;
  deadlineDate: string;
  description: string;
  createdAt: string;
  company: {
    id: string;
    legalName: string;
    city: string;
    sector: string;
    status: string;
  };
  skills: Array<{ id: string; isRequired: boolean; skill: { name: string } }>;
}

export default function AdminModerationPage() {
  const [listings, setListings] = React.useState<PendingListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/moderation/listings");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setListings(body.data.listings);
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load moderation queue." });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecision = async (
    listingId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    let reason: string | null = null;
    if (decision === "REJECTED") {
      reason = window.prompt("Enter reason for rejection (required, min 5 chars):");
      if (!reason || reason.trim().length < 5) {
        alert("A rejection reason of at least 5 characters is required.");
        return;
      }
    }

    setActionLoading(listingId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/moderation/listings/${listingId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: reason ? reason.trim() : null }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setMessage({
          type: "success",
          text: `Listing ${decision.toLowerCase()} successfully.`,
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
        <div className="animate-pulse text-muted-foreground">Loading moderation queue...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Internship Moderation Queue</h1>
            <Badge variant="destructive" className="text-xs uppercase">
              Admin Restricted
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review offers submitted by verified Moroccan companies before they appear in public search and AI discovery.
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

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card text-muted-foreground">
          No internship offers currently pending moderation.
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-primary-700">{item.company.legalName}</span>
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>📍 {item.city}</span>
                    <span>🏢 {item.modality}</span>
                    <span>⏱️ {item.durationWeeks} weeks</span>
                    <span>📅 Deadline: {new Date(item.deadlineDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="accent"
                    isLoading={actionLoading === item.id}
                    onClick={() => handleDecision(item.id, "APPROVED")}
                  >
                    Approve (Publish)
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
              </div>

              <p className="text-xs text-foreground/80 bg-muted/30 p-3 rounded-md line-clamp-3">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {item.skills.map((s) => (
                  <Badge key={s.id} variant="outline" className="text-[11px]">
                    {s.skill.name} {s.isRequired && "*"}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
