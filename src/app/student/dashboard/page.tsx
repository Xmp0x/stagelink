import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboardPage() {
  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, upload your private CV, and discover verified Moroccan internships.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/student/matches">
            <Button size="sm" variant="default" className="flex items-center gap-1.5">
              <span>My Matches</span>
            </Button>
          </Link>
          <Link href="/copilot">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
              Open AI Copilot
            </Button>
          </Link>
          <Link href="/internships">
            <Button variant="outline" size="sm">Explore Internships</Button>
          </Link>
        </div>
      </div>

      {/* Onboarding / Completeness Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Profile Completeness</h2>
              <Badge variant="default" className="text-xs">
                20% Initial
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your PDF CV to automatically extract education, skills, and languages with private review.
            </p>
          </div>
          <Link href="/student/profile">
            <Button size="sm" variant="default">
              Complete Profile & Upload CV
            </Button>
          </Link>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-4 overflow-hidden">
          <div className="bg-primary-600 h-2 rounded-full transition-all duration-500 w-[20%]" />
        </div>
      </div>

      {/* Grid: Saved & Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">My Applications</h3>
            <Badge variant="outline" className="text-xs">
              0 Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            You haven&apos;t submitted any applications yet. Browse verified offers and apply directly with explicit confirmation.
          </p>
          <Link href="/internships" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Browse Verified Offers
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Candidate Discoverability</h3>
            <Badge variant="secondary" className="text-xs">
              Private (Opt-in Required)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            In accordance with Law 09-08, companies cannot search for your profile unless you explicitly grant discoverability consent.
          </p>
          <Link href="/student/profile" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Manage Privacy & Consent
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
