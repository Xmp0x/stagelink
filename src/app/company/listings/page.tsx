"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CompanyListing {
  id: string;
  title: string;
  city: string;
  modality: string;
  durationWeeks: number;
  deadlineDate: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "PAUSED" | "CLOSED" | "REJECTED";
  rejectionReason?: string | null;
  _count: {
    applications: number;
    savedByStudents: number;
  };
  skills: Array<{ id: string; skill: { name: string } }>;
}

export default function CompanyListingsPage() {
  const [listings, setListings] = React.useState<CompanyListing[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [isVerified, setIsVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [title, setTitle] = React.useState("");
  const [sector, setSector] = React.useState("Technology");
  const [city, setCity] = React.useState("Tangier");
  const [modality, setModality] = React.useState<"ONSITE" | "HYBRID" | "REMOTE">("ONSITE");
  const [durationWeeks, setDurationWeeks] = React.useState("8");
  const [deadlineDate, setDeadlineDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [requirements, setRequirements] = React.useState("");
  const [skillsInput, setSkillsInput] = React.useState("");
  const [isPaid, setIsPaid] = React.useState(false);
  const [stipendAmount, setStipendAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fetchListings = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userBody = await userRes.json();
        const comp = userBody.data?.user?.companyMemberships?.[0]?.company;
        if (comp) {
          setCompanyId(comp.id);
          setIsVerified(comp.status === "VERIFIED");

          const res = await fetch(`/api/companies/${comp.id}/internships`);
          if (res.ok) {
            const body = await res.json();
            setListings(body.data.listings || []);
          }
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load listings." });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchListings();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (!deadlineDate) {
      alert("Please select an application deadline.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, isRequired: true }));

    try {
      const res = await fetch(`/api/companies/${companyId}/internships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sector,
          city,
          modality,
          durationWeeks: parseInt(durationWeeks, 10),
          deadlineDate: new Date(deadlineDate).toISOString(),
          description,
          requirements: requirements || null,
          isPaid,
          stipendAmount: isPaid && stipendAmount ? parseFloat(stipendAmount) : null,
          status: "PENDING_REVIEW",
          skills,
        }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setMessage({
          type: "success",
          text: "Internship listing created and submitted for platform moderation!",
        });
        setShowModal(false);
        // Reset form
        setTitle("");
        setDescription("");
        setRequirements("");
        setSkillsInput("");
        fetchListings();
      } else {
        setMessage({ type: "error", text: body.error?.message || "Failed to create listing." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error submitting listing." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (listingId: string, newStatus: string) => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/internships/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchListings();
      }
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-5xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading employer listings...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Internship Listings Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your recruitment pipeline, publish offers, and monitor applicant volume.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/company/dashboard">
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            disabled={!isVerified}
          >
            + Post New Internship
          </Button>
        </div>
      </div>

      {!isVerified && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed flex items-center justify-between gap-4">
          <span>
            ⚠️ <strong>Verification required:</strong> Your organization must complete business verification before publishing offers.
          </span>
          <Link href="/company/verification">
            <Button size="sm" variant="outline" className="bg-white">
              Verify Now
            </Button>
          </Link>
        </div>
      )}

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

      {/* Listings Table / Cards */}
      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card space-y-3">
          <h3 className="text-base font-semibold text-foreground">No internship listings created yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Create your first verified internship offer to begin receiving applications from qualified Moroccan students.
          </p>
          {isVerified && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              Post Your First Internship
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                  <Badge
                    variant={
                      item.status === "PUBLISHED"
                        ? "success"
                        : item.status === "PENDING_REVIEW"
                        ? "warning"
                        : item.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>📍 {item.city}</span>
                  <span>⏱️ {item.durationWeeks} weeks</span>
                  <span>📅 Deadline: {new Date(item.deadlineDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-primary-700">
                    📥 {item._count.applications} Applicants
                  </span>
                  <span>⭐ {item._count.savedByStudents} Saves</span>
                </div>
                {item.rejectionReason && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                    Moderator feedback: {item.rejectionReason}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/internships/${item.id}`}>
                  <Button size="sm" variant="ghost">
                    Preview
                  </Button>
                </Link>
                {item.status === "PUBLISHED" && (
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, "PAUSED")}>
                    Pause
                  </Button>
                )}
                {item.status === "PAUSED" && (
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, "PUBLISHED")}>
                    Resume
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal / Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Post New Internship Offer</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <Input
                id="title"
                label="Internship Title"
                required
                placeholder="e.g. Frontend Developer Intern (Next.js / React)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="modalCity" className="block text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    Moroccan City
                  </label>
                  <select
                    id="modalCity"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="Tangier">Tangier (Pilot)</option>
                    <option value="Casablanca">Casablanca</option>
                    <option value="Rabat">Rabat</option>
                    <option value="Marrakech">Marrakech</option>
                    <option value="Fes">Fes</option>
                    <option value="Agadir">Agadir</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modalModality" className="block text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    Modality
                  </label>
                  <select
                    id="modalModality"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={modality}
                    onChange={(e) => setModality(e.target.value as "ONSITE" | "HYBRID" | "REMOTE")}
                  >
                    <option value="ONSITE">On-site</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="durationWeeks"
                  label="Duration (Weeks)"
                  type="number"
                  min="2"
                  max="52"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                />
                <Input
                  id="deadline"
                  label="Application Deadline"
                  type="date"
                  required
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalDesc" className="block text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  Job Description & Learning Outcomes (min 30 chars)
                </label>
                <textarea
                  id="modalDesc"
                  rows={4}
                  required
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Describe the tasks, mentorship provided, and internship project goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Input
                id="skillsInput"
                label="Required Skills (Comma separated)"
                placeholder="e.g. React, Next.js, TypeScript, Git"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="isPaid"
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPaid" className="text-xs font-semibold cursor-pointer">
                  This internship offers a monthly stipend
                </label>
              </div>

              {isPaid && (
                <Input
                  id="stipendAmount"
                  label="Monthly Stipend (MAD)"
                  type="number"
                  placeholder="e.g. 2000"
                  value={stipendAmount}
                  onChange={(e) => setStipendAmount(e.target.value)}
                />
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={submitting}>
                  Submit for Moderation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
