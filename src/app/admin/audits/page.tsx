"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Shield, ArrowLeft, Filter, Loader2 } from "lucide-react";

interface AuditEventItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actor: { email: string; role: string } | null;
  metadata: any;
  createdAt: string;
}

export default function AdminAuditsPage() {
  const [events, setEvents] = React.useState<AuditEventItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = React.useState("");

  const fetchAudits = async (filter?: string) => {
    try {
      setLoading(true);
      const url = filter
        ? `/api/admin/audits?targetType=${encodeURIComponent(filter)}`
        : "/api/admin/audits";
      const res = await fetch(url);
      const body = await res.json();
      if (body.success && body.data?.events) {
        setEvents(body.data.events);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAudits(targetTypeFilter);
  }, [targetTypeFilter]);

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Security Audit Log
            </h1>
            <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-700">
              Immutable
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Chronological audit trail of all administrative and lifecycle security events.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Target Types</option>
            <option value="Company">Companies</option>
            <option value="Internship">Internships</option>
            <option value="Application">Applications</option>
            <option value="User">Users</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAudits(targetTypeFilter)}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse p-4" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <History className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">No Audit Events Recorded Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Administrative operations such as company verifications and user status changes will log events here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] py-0 font-mono">
                        {e.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-foreground">{e.targetType}</span>
                      <span className="text-muted-foreground font-mono text-[10px] block">
                        {e.targetId.slice(0, 16)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {e.actor ? (
                        <div>
                          <span className="text-foreground">{e.actor.email}</span>
                          <span className="text-[10px] text-muted-foreground block uppercase">
                            {e.actor.role}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">System</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[11px] text-muted-foreground font-mono">
                      {e.metadata ? JSON.stringify(e.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
