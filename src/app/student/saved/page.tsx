"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SavedItem {
  id: string;
  title: string;
  city: string;
  modality: string;
  durationWeeks: number;
  deadlineDate: string;
  company: {
    id: string;
    legalName: string;
    city: string;
    sector: string;
    status: string;
  };
  skills: Array<{ id: string; isRequired: boolean; skill: { name: string } }>;
}

export default function StudentSavedPage() {
  const [saved, setSaved] = React.useState<SavedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/me/saved");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setSaved(body.data.saved || []);
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load saved opportunities." });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (listingId: string) => {
    try {
      const res = await fetch(`/api/me/saved/${listingId}`, { method: "DELETE" });
      if (res.ok) {
        setSaved((prev) => prev.filter((item) => item.id !== listingId));
      }
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-4xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading saved opportunities...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Saved Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keep track of verified Moroccan internship offers you are interested in.
          </p>
        </div>
        <Link href="/internships">
          <Button variant="outline" size="sm">
            Explore More Offers
          </Button>
        </Link>
      </div>

      {message && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
          {message.text}
        </div>
      )}

      {saved.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card space-y-3">
          <h3 className="text-base font-semibold text-foreground">No saved opportunities yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            When exploring verified offers, click &quot;Save Listing&quot; to keep them bookmarked here for easy reference.
          </p>
          <Link href="/internships">
            <Button size="sm">Browse Verified Internships</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary-700">{item.company.legalName}</span>
                  <Badge variant="success" className="text-[10px] py-0 px-1">
                    Verified
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  <Link href={`/internships/${item.id}`} className="hover:text-primary-600 transition-colors">
                    {item.title}
                  </Link>
                </h3>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>📍 {item.city}</span>
                  <span>🏢 {item.modality}</span>
                  <span>⏱️ {item.durationWeeks} weeks</span>
                  <span>📅 Deadline: {new Date(item.deadlineDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/internships/${item.id}`}>
                  <Button size="sm" variant="default">
                    View & Apply
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(item.id)} className="text-destructive">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
