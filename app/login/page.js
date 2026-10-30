"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";

const HOME = { admin: "/admin", teacher: "/teacher", student: "/student" };

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      router.replace(HOME[data.role]);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-ink px-4 py-12">
        {/* the rising sun behind the card */}
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 translate-y-1/2 rounded-full bg-dawn/25" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-[320px] w-[320px] -translate-x-1/2 translate-y-1/2 rounded-full bg-dawn/40" />
        <div aria-hidden className="absolute bottom-0 left-0 right-0 h-1 bg-dawn" />

        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <LogoMark size={150} light />
            <p className="text-white/80">Examination Portal</p>
          </div>
          <form onSubmit={submit} className="panel space-y-4 p-6 shadow-xl shadow-black/20">
            <div>
              <h1 className="text-2xl font-semibold">Sign in</h1>
              <p className="mt-1 text-sm text-ink/60">Use the username and password from your institute.</p>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-wrong/5 px-3 py-2 text-sm text-wrong">
                {error}
              </p>
            )}
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary w-full py-2.5" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
      <p className="bg-sky py-4 text-center text-sm text-ink/60">Bright Horizon Institute · Examination Portal</p>
    </div>
  );
}
