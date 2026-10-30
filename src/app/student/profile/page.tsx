"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface StudentProfileData {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  city?: string | null;
  institution?: string | null;
  degree?: string | null;
  academicYear?: string | null;
  bio?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  preferredModality: "REMOTE" | "ONSITE" | "HYBRID";
  preferredDurationWeeks?: number | null;
  discoverabilityConsent: boolean;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    fieldOfStudy?: string | null;
    isCurrent: boolean;
  }>;
  skills: Array<{
    id: string;
    skill: { name: string };
    proficiency: string;
  }>;
}

interface CompletenessData {
  score: number;
  missingSteps: string[];
}

export default function StudentProfilePage() {
  const [profile, setProfile] = React.useState<StudentProfileData | null>(null);
  const [completeness, setCompleteness] = React.useState<CompletenessData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("Tangier");
  const [institution, setInstitution] = React.useState("");
  const [degree, setDegree] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [modality, setModality] = React.useState<"REMOTE" | "ONSITE" | "HYBRID">("ONSITE");
  const [durationWeeks, setDurationWeeks] = React.useState("8");
  const [consent, setConsent] = React.useState(false);

  // Skill input
  const [newSkill, setNewSkill] = React.useState("");
  const [skillProficiency, setSkillProficiency] = React.useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");

  // Education input
  const [newSchool, setNewSchool] = React.useState("");
  const [newDegree, setNewDegree] = React.useState("");

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/me/profile");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          const p = body.data.profile;
          setProfile(p);
          setCompleteness(body.data.completeness);
          setFirstName(p.firstName || "");
          setLastName(p.lastName || "");
          setPhone(p.phone || "");
          setCity(p.city || "Tangier");
          setInstitution(p.institution || "");
          setDegree(p.degree || "");
          setAcademicYear(p.academicYear || "");
          setBio(p.bio || "");
          setModality(p.preferredModality || "ONSITE");
          setDurationWeeks(p.preferredDurationWeeks ? String(p.preferredDurationWeeks) : "8");
          setConsent(Boolean(p.discoverabilityConsent));
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load profile. Please refresh." });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || null,
          city,
          institution: institution || null,
          degree: degree || null,
          academicYear: academicYear || null,
          bio: bio || null,
          preferredModality: modality,
          preferredDurationWeeks: parseInt(durationWeeks, 10) || 8,
          discoverabilityConsent: consent,
        }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setCompleteness(body.data.completeness);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: body.error?.message || "Failed to update profile." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error saving profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      const res = await fetch("/api/me/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSkill.trim(), proficiency: skillProficiency }),
      });
      if (res.ok) {
        setNewSkill("");
        loadProfile();
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/me/profile/skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadProfile();
      }
    } catch {
      // Ignore
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.trim() || !newDegree.trim()) return;

    try {
      const res = await fetch("/api/me/profile/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school: newSchool.trim(), degree: newDegree.trim() }),
      });
      if (res.ok) {
        setNewSchool("");
        setNewDegree("");
        loadProfile();
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const res = await fetch(`/api/me/profile/education/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadProfile();
      }
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-4xl text-center">
        <div className="animate-pulse text-muted-foreground">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Profile & Privacy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Keep your profile accurate to receive relevant, explainable recommendations and verified company visibility.
        </p>
      </div>

      {/* Completeness Banner */}
      {completeness && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Profile Completeness Score</span>
            <Badge variant={completeness.score >= 80 ? "success" : "default"} className="font-bold">
              {completeness.score}%
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          {completeness.missingSteps.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Suggested next steps:
              </span>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                {completeness.missingSteps.slice(0, 3).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
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

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
          Personal & Academic Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="First Name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            id="lastName"
            label="Last Name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="city" className="block text-xs font-semibold text-foreground/80 tracking-wide uppercase">
              Moroccan City
            </label>
            <select
              id="city"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="Tangier">Tangier (Pilot)</option>
              <option value="Casablanca">Casablanca</option>
              <option value="Rabat">Rabat</option>
              <option value="Marrakech">Marrakech</option>
              <option value="Fes">Fes</option>
              <option value="Agadir">Agadir</option>
              <option value="Oujda">Oujda</option>
              <option value="Tetouan">Tetouan</option>
            </select>
          </div>

          <Input
            id="phone"
            label="Phone Number (Optional)"
            placeholder="+212 600 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="institution"
            label="Institution"
            placeholder="e.g. CMC Tangier, 1337, ENSA"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <Input
            id="degree"
            label="Degree / Diploma"
            placeholder="e.g. Technicien Spécialisé, Bachelor"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
          />
          <Input
            id="academicYear"
            label="Academic Year"
            placeholder="e.g. 2nd Year, Final Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bio" className="block text-xs font-semibold text-foreground/80 tracking-wide uppercase">
            Professional Bio
          </label>
          <textarea
            id="bio"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Share your interests, technical aspirations, and what kind of internship you are looking for..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="modality" className="block text-xs font-semibold text-foreground/80 tracking-wide uppercase">
              Preferred Work Modality
            </label>
            <select
              id="modality"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={modality}
              onChange={(e) => setModality(e.target.value as "REMOTE" | "ONSITE" | "HYBRID")}
            >
              <option value="ONSITE">On-site (Morocco)</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="durationWeeks" className="block text-xs font-semibold text-foreground/80 tracking-wide uppercase">
              Target Duration (Weeks)
            </label>
            <select
              id="durationWeeks"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
            >
              <option value="4">4 weeks (1 month)</option>
              <option value="8">8 weeks (2 months - Standard PFE)</option>
              <option value="12">12 weeks (3 months)</option>
              <option value="24">24 weeks (6 months)</option>
            </select>
          </div>
        </div>

        {/* Moroccan Law 09-08 Privacy & Consent */}
        <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <input
              id="consent"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="consent" className="text-xs text-foreground leading-relaxed cursor-pointer">
              <span className="font-semibold block text-primary-900 mb-0.5">
                Enable Candidate Discoverability (Opt-in)
              </span>
              Allow verified Moroccan companies to discover my profile in candidate searches based on my skills and location. In accordance with Moroccan Law 09-08, your private CV file is never exposed until you explicitly submit an application.
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={saving}>
            Save Profile Changes
          </Button>
        </div>
      </form>

      {/* Skills Management */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
          Skills & Technologies
        </h2>

        <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-3">
          <Input
            id="newSkill"
            placeholder="Add a skill (e.g. React, Figma, Python, Logistics)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={skillProficiency}
            onChange={(e) => setSkillProficiency(e.target.value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED")}
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <Button type="submit" size="sm" variant="default">
            Add Skill
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {profile?.skills.length === 0 ? (
            <p className="text-xs text-muted-foreground">No skills added yet. Add at least 3 skills to improve matching.</p>
          ) : (
            profile?.skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border"
              >
                {s.skill.name}
                <span className="text-[10px] text-muted-foreground">({s.proficiency.toLowerCase()})</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(s.id)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${s.skill.name}`}
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Education Management */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
          Education & Qualifications
        </h2>

        <form onSubmit={handleAddEducation} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="newSchool"
            placeholder="School (e.g. CMC Tangier)"
            value={newSchool}
            onChange={(e) => setNewSchool(e.target.value)}
          />
          <Input
            id="newDegree"
            placeholder="Degree (e.g. BTS Informatique)"
            value={newDegree}
            onChange={(e) => setNewDegree(e.target.value)}
          />
          <Button type="submit" size="sm" variant="default" className="sm:self-end">
            Add Education
          </Button>
        </form>

        <div className="space-y-3 pt-2">
          {profile?.education.length === 0 ? (
            <p className="text-xs text-muted-foreground">No education records added yet.</p>
          ) : (
            profile?.education.map((edu) => (
              <div
                key={edu.id}
                className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border"
              >
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{edu.degree}</h4>
                  <p className="text-xs text-muted-foreground">{edu.school}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="text-destructive hover:bg-rose-50 hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
