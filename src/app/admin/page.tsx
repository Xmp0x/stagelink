import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPortalPage() {
  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Administration</h1>
            <Badge variant="destructive" className="text-xs">
              Restricted Access
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review company verification requests, moderate internship listings, and monitor platform integrity.
          </p>
        </div>
      </div>

      {/* Admin Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Company Verification Queue</h2>
            <Badge variant="warning" className="text-xs">
              0 Pending
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Review legal documentation, ICE/RC numbers, and decide approval/rejection with mandatory audit logging.
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Open Verification Queue
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Internship Moderation Queue</h2>
            <Badge variant="default" className="text-xs">
              0 Pending
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Moderate listings submitted by verified companies before they appear in public search and AI discovery.
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Open Moderation Queue
          </Button>
        </div>
      </div>
    </div>
  );
}
