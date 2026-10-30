"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApplicationItem {
  id: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  submittedAt: string;
  coverNote?: string | null;
  internship: {
    id: string;
    title: string;
    city: string;
    company: {
      id: string;
      legalName: string;
      city: string;
      status: string;
    };
  };
  cvDocument?: {
    filename: string;
  } | null;
  events: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    note?: string | null;
    createdAt: string;
  }>;
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = React.useState<ApplicationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [withdrawingId, setWithdrawingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/me/applications");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setApplications(body.data.applications || []);
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load applications." });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
      return;
    }

    setWithdrawingId(applicationId);
    setMessage(null);

    try {
      const res = await fetch(`/api/me/applications/${applicationId}/withdraw`, {
        method: "POST",
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setMessage({ type: "success", text: "Application withdrawn successfully." });
        fetchApplications();
      } else {
        setMessage({ type: "error", text: body.error?.message || "Failed to withdraw application." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error withdrawing application." });
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: ApplicationItem["status"]) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge variant="success">Accepted 🎉</Badge>;
      case "SHORTLISTED":
        return <Badge variant="default">Shortlisted ⭐</Badge>;
      case "INTERVIEW":
        return <Badge variant="accent">Interview Scheduled 📅</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="warning">Under Review ⏳</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Not Selected</Badge>;
      case "WITHDRAWN":
        return <Badge variant="secondary">Withdrawn</Badge>;
      case "SUBMITTED":
      default:
        return <Badge variant="outline">Submitted 📬</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-4xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Applications Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your internship submissions, status transitions, and employer feedback in real time.
          </p>
        </div>
        <Link href="/internships">
          <Button variant="outline" size="sm">
            Explore Opportunities
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

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card space-y-3">
          <h3 className="text-base font-semibold text-foreground">No applications submitted yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Find verified internship opportunities and apply with your uploaded CV and explicit confirmation.
          </p>
          <Link href="/internships">
            <Button size="sm">Browse Verified Internships</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-primary-700">
                    {app.internship.company.legalName} • {app.internship.city}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">
                    <Link href={`/internships/${app.internship.id}`} className="hover:text-primary-600 transition-colors">
                      {app.internship.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Applied: {new Date(app.submittedAt).toLocaleDateString()}</span>
                    {app.cvDocument && <span>📄 {app.cvDocument.filename}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(app.status)}
                  {["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"].includes(app.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive hover:bg-rose-50 hover:text-destructive"
                      onClick={() => handleWithdraw(app.id)}
                      isLoading={withdrawingId === app.id}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>

              {app.coverNote && (
                <div className="p-3 rounded-md bg-muted/30 text-xs text-muted-foreground">
                  <span className="font-semibold block text-foreground mb-0.5">Your Note to Employer:</span>
                  {app.coverNote}
                </div>
              )}

              {/* Status Timeline */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Application Timeline
                </span>
                <div className="space-y-2">
                  {app.events.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-3 text-xs">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">
                          {evt.toStatus.replace("_", " ")}
                        </span>
                        <span className="text-muted-foreground ml-2 text-[11px]">
                          {new Date(evt.createdAt).toLocaleString()}
                        </span>
                        {evt.note && <p className="text-muted-foreground mt-0.5">{evt.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
