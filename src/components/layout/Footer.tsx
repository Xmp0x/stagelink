import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-12 text-sm text-muted-foreground">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="text-lg font-bold text-primary-900">
            Stage<span className="text-accent-emerald">Link</span>
          </div>
          <p className="text-xs leading-relaxed">
            Morocco&apos;s verified internship discovery and recruitment platform. Connecting Moroccan talent with genuine, vetted companies through explainable AI matching.
          </p>
          <p className="text-[11px] text-muted-foreground/75">
            Strictly internal verified database. Zero third-party web scraping.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            For Students
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/internships" className="hover:text-foreground transition-colors">
                Explore Opportunities
              </Link>
            </li>
            <li>
              <Link href="/copilot" className="hover:text-foreground transition-colors">
                AI Internship Copilot
              </Link>
            </li>
            <li>
              <Link href="/student/profile" className="hover:text-foreground transition-colors">
                Private CV & Profile
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            For Employers
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/register?role=COMPANY" className="hover:text-foreground transition-colors">
                Post an Internship
              </Link>
            </li>
            <li>
              <Link href="/company/verification" className="hover:text-foreground transition-colors">
                Company Verification
              </Link>
            </li>
            <li>
              <Link href="/company/candidates" className="hover:text-foreground transition-colors">
                Candidate Discovery (Opt-in)
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Trust & Ethics
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <span className="text-emerald-700 font-medium">Verified Companies Only</span>
            </li>
            <li>
              <span>Moroccan Law 09-08 Privacy First</span>
            </li>
            <li>
              <span>Private Secure Storage</span>
            </li>
            <li>
              <span>English MVP Baseline</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StageLink. All rights reserved.</p>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span>Privacy Policy (coming soon)</span>
          <span>Terms of Service (coming soon)</span>
        </div>
      </div>
    </footer>
  );
}
