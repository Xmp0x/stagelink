"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavbarUser {
  id: string;
  email: string;
  role: "STUDENT" | "COMPANY" | "ADMIN";
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = React.useState<NavbarUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const body = await res.json();
          if (body.success && body.data?.user) {
            setUser(body.data.user);
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch {
      // Ignore
    }
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "STUDENT") return "/student/dashboard";
    if (user.role === "COMPANY") return "/company/dashboard";
    if (user.role === "ADMIN") return "/admin";
    return "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary-900">
              Stage<span className="text-accent-emerald">Link</span>
            </span>
            <Badge variant="default" className="text-[10px] uppercase font-bold py-0 px-1.5 bg-primary-100 text-primary-800 border-none">
              Morocco
            </Badge>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/internships" className="hover:text-foreground transition-colors">
              Explore Internships
            </Link>
            <Link href="/copilot" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <span>AI Copilot</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
            </Link>
            <Link href="/companies" className="hover:text-foreground transition-colors">
              For Companies
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
              <Link href={getDashboardLink()}>
                <Button size="sm" variant="outline">
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
