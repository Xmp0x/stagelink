"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Building2,
  Briefcase,
  Users,
  FileCheck2,
  History,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface AnalyticsData {
  metrics: {
    students: { totalRegistered: number };
    companies: { total: number; verified: number; pendingVerification: number };
    internships: { total: number; activePublished: number };
    applications: { totalSubmitted: number; byStatus: Record<string, number> };
    matching: { totalMatchesComputed: number };
  };
  anonymized: boolean;
  timestamp: string;
}

export default function AdminPortalPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        const body = await res.json();
        if (body.success && body.data) {
          setData(body.data);
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Platform Administration
            </h1>
            <Badge variant="destructive" className="text-xs">
              Super Admin Mode
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Governance, verification workflows, listing moderation, and tamper-evident audit logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/audits">
            <Button variant="outline" size="sm" className="gap-1.5">
              <History className="h-4 w-4" />
              Audit Log
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button size="sm" className="gap-1.5">
              <Users className="h-4 w-4" />
              User Accounts
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
            <Users className="h-4 w-4 text-primary-600" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {loading ? "..." : data?.metrics.students.totalRegistered ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Registered candidates</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Organizations</span>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {loading ? "..." : `${data?.metrics.companies.verified ?? 0} / ${data?.metrics.companies.total ?? 0}`}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {data?.metrics.companies.pendingVerification ?? 0} pending review
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Listings</span>
            <Briefcase className="h-4 w-4 text-primary-600" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {loading ? "..." : data?.metrics.internships.activePublished ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {data?.metrics.internships.total ?? 0} total listings
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            <TrendingUp className="h-4 w-4 text-accent-emerald" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {loading ? "..." : data?.metrics.applications.totalSubmitted ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Processed through ATS</p>
        </div>
      </div>

      {/* Main Administrative Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Verification Queue */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-foreground">Company Verification Queue</h2>
            </div>
            {data && data.metrics.companies.pendingVerification > 0 && (
              <Badge variant="warning" className="text-xs">
                {data.metrics.companies.pendingVerification} Action Required
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Review legal documentation, Moroccan ICE/RC registration numbers, and render approval or rejection
            decisions with required audit notes.
          </p>
          <Link href="/admin/verifications" className="block pt-2">
            <Button variant="default" size="sm" className="w-full flex items-center justify-center gap-1.5">
              <span>Open Verification Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Internship Moderation Queue */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-foreground">Listing Moderation Queue</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              Quality Assurance
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Moderate internship listings submitted by verified Moroccan employers before they become discoverable
            in public search and candidate recommendation algorithms.
          </p>
          <Link href="/admin/moderation" className="block pt-2">
            <Button variant="default" size="sm" className="w-full flex items-center justify-center gap-1.5">
              <span>Open Moderation Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* User Account Governance */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-foreground">Account Governance</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              Security
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Inspect all student, employer, and administrator accounts across the platform. Suspend or reactivate
            accounts with reason logging.
          </p>
          <Link href="/admin/users" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5">
              <span>Manage User Accounts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Immutable Audit Log */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-foreground">Security Audit Trail</h2>
            </div>
            <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-700">
              Tamper-Evident
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chronological audit events documenting verification decisions, listing publications, account status
            changes, and sensitive data access.
          </p>
          <Link href="/admin/audits" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5">
              <span>View Audit Events</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
