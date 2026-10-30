"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "COMPANY" ? "COMPANY" : "STUDENT";

  const [role, setRole] = React.useState<"STUDENT" | "COMPANY">(initialRole);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [sector, setSector] = React.useState("");
  const [city, setCity] = React.useState("Tangier");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        role,
        email,
        password,
        city,
        ...(role === "STUDENT" ? { firstName, lastName } : { companyName, sector }),
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message || "Registration failed. Please check your information.");
        setLoading(false);
        return;
      }

      router.push(body.data.redirectUrl || "/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your StageLink account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Join the Morocco-first verified internship discovery and recruitment network.
        </p>
      </div>

      {/* Role Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
            role === "STUDENT" ? "bg-white text-primary-900 shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setRole("STUDENT")}
        >
          🎓 I am a Student / Intern
        </button>
        <button
          type="button"
          className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
            role === "COMPANY" ? "bg-white text-primary-900 shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setRole("COMPANY")}
        >
          🏢 I represent an Employer
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {role === "STUDENT" ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="First Name"
              required
              placeholder="Amine"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              id="lastName"
              label="Last Name"
              required
              placeholder="El Amrani"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              id="companyName"
              label="Company Legal Name"
              required
              placeholder="e.g. Tangier Med Tech Solutions"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              id="sector"
              label="Sector / Industry"
              placeholder="e.g. Logistics, Software, Engineering"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
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
            id="email"
            label="Email Address"
            type="email"
            required
            placeholder={role === "STUDENT" ? "student@institution.ma" : "contact@company.ma"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Input
          id="password"
          label="Password (min. 8 chars, letters & numbers)"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="text-xs text-muted-foreground leading-relaxed pt-2">
          By registering, you agree to our Terms of Service and acknowledge our privacy notice in accordance with Moroccan Law 09-08.
        </div>

        <Button type="submit" className="w-full mt-4" isLoading={loading}>
          {role === "STUDENT" ? "Create Student Account" : "Register Organization"}
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <React.Suspense
        fallback={
          <div className="w-full max-w-lg p-8 rounded-xl border border-border bg-card shadow-sm text-center">
            <div className="animate-pulse text-sm text-muted-foreground">Loading registration form...</div>
          </div>
        }
      >
        <RegisterForm />
      </React.Suspense>
    </div>
  );
}
