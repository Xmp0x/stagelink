"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface InternshipItem {
  id: string;
  title: string;
  department?: string | null;
  sector: string;
  city: string;
  modality: "REMOTE" | "ONSITE" | "HYBRID";
  durationWeeks: number;
  startMonth?: string | null;
  deadlineDate: string;
  openPositions: number;
  description: string;
  isPaid: boolean;
  stipendAmount?: number | null;
  company: {
    id: string;
    legalName: string;
    city: string;
    sector: string;
    status: string;
  };
  skills: Array<{
    id: string;
    isRequired: boolean;
    skill: { name: string };
  }>;
}

function InternshipsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = React.useState(searchParams.get("q") || "");
  const [city, setCity] = React.useState(searchParams.get("city") || "all");
  const [modality, setModality] = React.useState(searchParams.get("modality") || "all");
  const [isPaid, setIsPaid] = React.useState(searchParams.get("isPaid") || "all");

  const [items, setItems] = React.useState<InternshipItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const fetchInternships = React.useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city && city !== "all") params.set("city", city);
    if (modality && modality !== "all") params.set("modality", modality);
    if (isPaid && isPaid !== "all") params.set("isPaid", isPaid);

    try {
      const res = await fetch(`/api/internships?${params.toString()}`);
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error("Search unavailable");
      if (currentRequest !== requestId.current) return;
      setItems(body.data.items);
      setTotal(body.data.pagination.total);
    } catch {
      if (currentRequest !== requestId.current) return;
      setItems([]);
      setTotal(0);
      setError("We couldn't load internships. Please try again in a moment.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [q, city, modality, isPaid]);

  React.useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInternships();
  };

  const clearFilters = () => {
    setQ("");
    setCity("all");
    setModality("all");
    setIsPaid("all");
    router.push("/internships");
  };

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="default" className="text-xs uppercase">
                🇲🇦 Internal Database
              </Badge>
              <span className="text-xs text-muted-foreground">
                Verified Moroccan Companies Only
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Explore Verified Internships
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse genuine, audited opportunities across Moroccan cities. No external scrapers or expired postings.
            </p>
          </div>
          <Link href="/copilot">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
              Ask AI Copilot to Search
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-card border border-border p-4 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3"
      >
        <Input
          placeholder="Keywords, skills, title..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="md:col-span-2"
        />

        <select
          aria-label="Filter by City"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="all">All Moroccan Cities</option>
          <option value="Tangier">Tangier (Pilot)</option>
          <option value="Casablanca">Casablanca</option>
          <option value="Rabat">Rabat</option>
          <option value="Marrakech">Marrakech</option>
          <option value="Fes">Fes</option>
          <option value="Agadir">Agadir</option>
          <option value="Tetouan">Tetouan</option>
        </select>

        <select
          aria-label="Filter by Work Modality"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={modality}
          onChange={(e) => setModality(e.target.value)}
        >
          <option value="all">All Modalities</option>
          <option value="ONSITE">On-site</option>
          <option value="HYBRID">Hybrid</option>
          <option value="REMOTE">Remote</option>
        </select>

        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1">
            Search
          </Button>
          {(q || city !== "all" || modality !== "all" || isPaid !== "all") && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span>
          Showing <strong className="text-foreground">{items.length}</strong> of{" "}
          <strong className="text-foreground">{total}</strong> verified active listings
        </span>
      </div>

      {/* Listings List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground animate-pulse">
          Loading verified internships from the internal database...
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center space-y-4">
          <p className="text-rose-700">{error}</p>
          <Button variant="outline" onClick={fetchInternships}>Try again</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card space-y-3">
          <h3 className="text-base font-semibold text-foreground">
            No matching verified internships found
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            StageLink strictly displays authentic offers from vetted companies. We do not import third-party web scraper listings. Try clearing or relaxing your filters.
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((listing) => (
            <div
              key={listing.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary-700">{listing.company.legalName}</span>
                    <Badge variant="success" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                      <span>✓ Verified</span>
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    <Link href={`/internships/${listing.id}`} className="hover:text-primary-600 transition-colors">
                      {listing.title}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>📍 {listing.city}</span>
                    <span>🏢 {listing.modality}</span>
                    <span>⏱️ {listing.durationWeeks} weeks</span>
                    {listing.isPaid ? (
                      <span className="text-emerald-700 font-semibold">
                        💵 Stipend: {listing.stipendAmount ? `${listing.stipendAmount} MAD/mo` : "Paid"}
                      </span>
                    ) : (
                      <span>Unpaid / Academic PFE</span>
                    )}
                    <span>📅 Deadline: {new Date(listing.deadlineDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link href={`/internships/${listing.id}`}>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {listing.description}
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {listing.skills.map((s) => (
                  <span
                    key={s.id}
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      s.isRequired
                        ? "bg-primary-50 text-primary-700 border border-primary-200"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {s.skill.name} {s.isRequired && "*"}
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

export default function InternshipsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container py-12 max-w-6xl text-center">
          <div className="animate-pulse text-muted-foreground">Loading search engine...</div>
        </div>
      }
    >
      <InternshipsContent />
    </React.Suspense>
  );
}
