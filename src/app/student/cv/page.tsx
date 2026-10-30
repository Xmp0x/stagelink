"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExtractedData {
  id: string;
  skills: Array<{ name: string; confidence: number }>;
  education: Array<{ school: string; degree: string; confidence: number }>;
  languages: string[];
  confidence: number;
  warning?: string;
}

export default function StudentCVPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [extraction, setExtraction] = React.useState<ExtractedData | null>(null);
  const [cvDocId, setCvDocId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selection states for diff
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = React.useState<Array<{ school: string; degree: string }>>([]);
  const [applying, setApplying] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf" && !selected.name.endsWith(".pdf")) {
        setMessage({ type: "error", text: "Only PDF files are supported." });
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File exceeds 5MB size limit." });
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);
    setExtraction(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/me/cv", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setExtraction(body.data.extraction);
        setCvDocId(body.data.cvDocument.id);
        // Pre-select all extracted items by default for convenience
        setSelectedSkills(body.data.extraction.skills.map((s: { name: string }) => s.name));
        setSelectedEducation(body.data.extraction.education.map((e: { school: string; degree: string }) => ({
          school: e.school,
          degree: e.degree,
        })));
        setMessage({
          type: "success",
          text: "CV parsed successfully! Review extracted suggestions below before applying to your profile.",
        });
      } else {
        setMessage({
          type: "error",
          text: body.error?.message || "Failed to process CV file.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during upload." });
    } finally {
      setUploading(false);
    }
  };

  const handleApplyDiff = async () => {
    if (!extraction) return;
    setApplying(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/me/cv/extractions/${extraction.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedSkills: selectedSkills,
          approvedEducation: selectedEducation,
        }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setMessage({
          type: "success",
          text: `Applied ${selectedSkills.length} skills and ${selectedEducation.length} education entries to your profile!`,
        });
        setExtraction(null);
        setFile(null);
      } else {
        setMessage({
          type: "error",
          text: body.error?.message || "Failed to apply changes.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error applying diff." });
    } finally {
      setApplying(false);
    }
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    );
  };

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Private CV Upload & Parsing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your PDF CV to securely store it and automatically extract profile suggestions with confirmed review.
          </p>
        </div>
        <Link href="/student/profile">
          <Button variant="outline" size="sm">
            View Profile
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

      {/* Upload Box */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground">Upload Your PDF CV</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Stored in isolated private storage outside the webroot. Moroccan Law 09-08 privacy guarantee: no company or third-party can download your CV unless you explicitly submit an application to their offer.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              id="cvFile"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
            <Button type="submit" isLoading={uploading} disabled={!file} className="w-full sm:w-auto">
              Upload & Parse CV
            </Button>
          </div>
          {file && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-semibold text-foreground">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </form>
      </div>

      {/* Extraction Warning if scanned */}
      {extraction?.warning && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
          <span className="font-semibold block mb-1">⚠️ Scanned PDF Notice</span>
          {extraction.warning}
        </div>
      )}

      {/* Extraction Diff & Confirmation */}
      {extraction && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Review Extracted Suggestions</h3>
              <p className="text-xs text-muted-foreground">
                Select which suggestions you wish to apply to your profile. Untrusted data is never applied automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Confidence: {(extraction.confidence * 100).toFixed(0)}%</Badge>
              {cvDocId && (
                <a
                  href={`/api/me/cv/${cvDocId}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline font-medium"
                >
                  Preview Uploaded PDF
                </a>
              )}
            </div>
          </div>

          {/* Skills Diff */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Extracted Skills ({extraction.skills.length})</h4>
            {extraction.skills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No standard technical skills detected in the PDF text.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {extraction.skills.map((s, idx) => {
                  const isChecked = selectedSkills.includes(s.name);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSkill(s.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isChecked
                          ? "bg-primary-600 text-white shadow-sm"
                          : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                      }`}
                    >
                      <span>{isChecked ? "✓" : "+"}</span>
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Education Diff */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Extracted Education ({extraction.education.length})</h4>
            {extraction.education.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No educational qualifications detected.</p>
            ) : (
              <div className="space-y-2">
                {extraction.education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md border border-border bg-muted/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold block text-foreground">{edu.degree}</span>
                      <span className="text-muted-foreground">{edu.school}</span>
                    </div>
                    <Badge variant="outline">{(edu.confidence * 100).toFixed(0)}% match</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setExtraction(null)}>
              Dismiss All
            </Button>
            <Button size="sm" isLoading={applying} onClick={handleApplyDiff}>
              Apply Selected Suggestions to Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
