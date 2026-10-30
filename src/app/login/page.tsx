"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message || "Invalid email or password.");
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
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in to StageLink</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your student profile, application pipeline, or company workspace.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input
            id="email"
            label="Email address"
            type="email"
            required
            autoComplete="email"
            placeholder="you@institution.ma"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" className="w-full mt-6" isLoading={loading}>
            Sign in
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
