import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CompanyDashboardPage() {
  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Employer Workspace</h1>
            <Badge variant="warning" className="text-xs">
              Pending Verification
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Publish authentic Moroccan internship offers and recruit verified candidates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/company/candidates">
            <Button size="sm" variant="default">
              Candidate Discovery
            </Button>
          </Link>
          <Link href="/company/listings">
            <Button size="sm" variant="outline">
              Listings
            </Button>
          </Link>
          <Link href="/company/verification">
            <Button size="sm" variant="outline">
              Verification
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 space-y-3">
        <h2 className="text-base font-semibold text-amber-900">
          Verification Required to Publish Listings
        </h2>
        <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
          To protect Moroccan students from phantom postings and fraudulent recruitment, only verified organizations can publish public listings and search discoverable candidates. Please provide your business registration proof (RC/ICE) for platform review.
        </p>
        <div className="pt-1">
          <Link href="/company/verification">
            <Button size="sm" variant="outline" className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100">
              Complete Organization Verification
            </Button>
          </Link>
        </div>
      </div>

      {/* Pipeline Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Active Listings</span>
          <div className="text-3xl font-bold text-foreground">0</div>
          <p className="text-xs text-muted-foreground">Listings require verification before publishing.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Applicants</span>
          <div className="text-3xl font-bold text-foreground">0</div>
          <p className="text-xs text-muted-foreground">Applicants across your active positions.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Interviews Scheduled</span>
          <div className="text-3xl font-bold text-foreground">0</div>
          <p className="text-xs text-muted-foreground">Candidates in interview status.</p>
        </div>
      </div>
    </div>
  );
}
