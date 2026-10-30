"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CandidateApplication {
  id: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  submittedAt: string;
  coverNote?: string | null;
  internship: {
    id: string;
    title: string;
    city: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    city?: string | null;
    institution?: string | null;
    degree?: string | null;
    profileCompleteness: number;
    skills: Array<{ id: string; skill: { name: string } }>;
  };
  cvDocument?: {
    id: string;
    filename: string;
    fileSizeBytes: number;
  } | null;
  events: Array<{
    id: string;
    toStatus: string;
    note?: string | null;
    createdAt: string;
  }>;
}

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = React.useState<CandidateApplication[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchApplications = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userBody = await userRes.json();
        const comp = userBody.data?.user?.companyMemberships?.[0]?.company;
        if (comp) {
          setCompanyId(comp.id);
          const res = await fetch(`/api/companies/${comp.id}/applications`);
          if (res.ok) {
            const body = await res.json();
            setApplications(body.data.applications || []);
          }
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load candidate applications." });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (
    applicationId: string,
    newStatus: "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED"
  ) => {
    if (!companyId) return;

    let note: string | null = null;
    if (newStatus === "INTERVIEW") {
      note = window.prompt("Enter interview details / proposed dates (optional):");
    } else if (newStatus === "REJECTED") {
      note = window.prompt("Enter feedback for candidate (optional):");
    }

    setActionLoading(applicationId);
    setMessage(null);

    try {
      const res = await fetch(`/api/companies/${companyId}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setMessage({
          type: "success",
          text: `Candidate status updated to ${newStatus.replace("_", " ")}.`,
        });
        fetchApplications();
      } else {
        setMessage({ type: "error", text: body.error?.message || "Failed to update status." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error updating candidate status." });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filterStatus === "all") return true;
    return app.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="container py-12 max-w-5xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading recruitment candidate pipeline...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Candidate ATS Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review incoming student applications, download verified CVs, and advance candidates through recruitment stages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/company/dashboard">
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/company/listings">
            <Button variant="outline" size="sm">
              My Listings
            </Button>
          </Link>
        </div>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {["all", "SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "ACCEPTED", "REJECTED"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterStatus === st
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {st === "all" ? `All (${applications.length})` : st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Candidate List */}
      {filteredApps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card space-y-3">
          <h3 className="text-base font-semibold text-foreground">No candidates in this stage</h3>
          <p className="text-xs text-muted-foreground">
            Applications submitted to your published offers will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-foreground">
                      {app.student.firstName} {app.student.lastName}
                    </h3>
                    <Badge variant="outline">
                      {app.student.degree || "Candidate"} • {app.student.city}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applied for: <strong className="text-foreground">{app.internship.title}</strong> •{" "}
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Institution: <span className="text-foreground">{app.student.institution || "Not specified"}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {app.cvDocument && (
                    <a
                      href={`/api/me/cv/${app.cvDocument.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button size="sm" variant="outline" className="text-xs">
                        📄 Download CV
                      </Button>
                    </a>
                  )}

                  {/* Transition Actions */}
                  {app.status === "SUBMITTED" && (
                    <Button
                      size="sm"
                      variant="default"
                      isLoading={actionLoading === app.id}
                      onClick={() => handleStatusChange(app.id, "UNDER_REVIEW")}
                    >
                      Start Review
                    </Button>
                  )}
                  {["SUBMITTED", "UNDER_REVIEW"].includes(app.status) && (
                    <Button
                      size="sm"
                      variant="default"
                      isLoading={actionLoading === app.id}
                      onClick={() => handleStatusChange(app.id, "SHORTLISTED")}
                    >
                      Shortlist
                    </Button>
                  )}
                  {["UNDER_REVIEW", "SHORTLISTED"].includes(app.status) && (
                    <Button
                      size="sm"
                      variant="accent"
                      isLoading={actionLoading === app.id}
                      onClick={() => handleStatusChange(app.id, "INTERVIEW")}
                    >
                      Schedule Interview
                    </Button>
                  )}
                  {["SHORTLISTED", "INTERVIEW"].includes(app.status) && (
                    <Button
                      size="sm"
                      variant="accent"
                      isLoading={actionLoading === app.id}
                      onClick={() => handleStatusChange(app.id, "ACCEPTED")}
                    >
                      Accept Candidate
                    </Button>
                  )}
                  {["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"].includes(app.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-rose-50"
                      isLoading={actionLoading === app.id}
                      onClick={() => handleStatusChange(app.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>

              {app.coverNote && (
                <div className="p-3 rounded-md bg-muted/30 text-xs text-foreground/90">
                  <span className="font-semibold block text-foreground mb-0.5">Candidate Note:</span>
                  {app.coverNote}
                </div>
              )}

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {app.student.skills.map((s) => (
                  <span
                    key={s.id}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border"
                  >
                    {s.skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
