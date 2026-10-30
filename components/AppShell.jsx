"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo, { LogoMark } from "./Logo";

const NAV = {
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/teachers", label: "Teachers" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/courses", label: "Courses" },
    { href: "/admin/results", label: "Results" },
  ],
  teacher: [
    { href: "/teacher", label: "My courses" },
    { href: "/teacher/students", label: "My students" },
  ],
  student: [{ href: "/student", label: "My exams" }],
};
const ROLE_LABEL = { admin: "Administrator", teacher: "Teacher", student: "Student" };

export default function AppShell({ session, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = NAV[session.role] || [];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const active = (href) => (href === `/${session.role}` ? pathname === href : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href={`/${session.role}`} aria-label="Home">
            <Logo size={48} light />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right leading-tight">
              <div className="font-medium">{session.name}</div>
              <div className="text-white/60">{ROLE_LABEL[session.role]}</div>
            </div>
            <button onClick={logout} className="rounded-lg border border-white/25 px-3 py-1.5 hover:bg-white/10">
              Sign out
            </button>
          </div>
        </div>
        {/* the horizon line */}
        <div className="h-1 bg-gradient-to-r from-dawn via-dawn to-sky" />
        {links.length > 1 && (
          <nav className="bg-paper text-ink">
            <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${
                    active(l.href) ? "border-ink font-medium" : "border-transparent text-ink/60 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 text-sm text-ink/60">
          <LogoMark size={28} />
          <span>Bright Horizon Institute · Examination Portal</span>
        </div>
      </footer>
    </div>
  );
}
