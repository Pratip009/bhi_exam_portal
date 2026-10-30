"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading, Empty } from "./ui";

export default function UserManager({ role }) {
  const isStudent = role === "student";
  const noun = isStudent ? "student" : "teacher";
  const blank = { name: "", username: "", password: "", rollNo: "" };
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const load = () => api(`/api/admin/users?role=${role}`).then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [role]);

  async function create(e) {
    e.preventDefault();
    setBusy(true); setError(""); setMsg("");
    try {
      await api("/api/admin/users", { method: "POST", body: { ...form, role } });
      setMsg(`Account created. Username: ${form.username.toLowerCase().trim()}  Password: ${form.password}`);
      setForm(blank);
      load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  async function resetPassword(u) {
    const password = prompt(`New password for ${u.name} (at least 6 characters):`);
    if (!password) return;
    try {
      await api(`/api/admin/users/${u._id}`, { method: "PATCH", body: { password } });
      setMsg(`Password for ${u.username} changed to: ${password}`);
    } catch (err) { setError(err.message); }
  }

  async function remove(u) {
    if (!confirm(`Delete ${u.name}? They will be removed from all courses${isStudent ? " and their exam results deleted" : ""}.`)) return;
    try {
      await api(`/api/admin/users/${u._id}`, { method: "DELETE" });
      load();
    } catch (err) { setError(err.message); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const q = query.toLowerCase();
  const shown = (users || []).filter((u) => !q || [u.name, u.username, u.rollNo].some((v) => v?.toLowerCase().includes(q)));

  return (
    <>
      <PageHeader title={isStudent ? "Students" : "Teachers"} subtitle={`Create ${noun} accounts and manage their passwords.`} />
      <Notice onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setMsg("")}>{msg}</Notice>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <form onSubmit={create} className="panel h-fit space-y-3 p-5">
          <h2 className="text-lg font-semibold">Add a {noun}</h2>
          <div><label className="label">Full name</label><input className="input" value={form.name} onChange={set("name")} required /></div>
          {isStudent && <div><label className="label">Roll number (optional)</label><input className="input" value={form.rollNo} onChange={set("rollNo")} /></div>}
          <div><label className="label">Username</label><input className="input" value={form.username} onChange={set("username")} required placeholder={isStudent ? "e.g. bhi2026-014" : "e.g. r.sharma"} /></div>
          <div><label className="label">Password</label><input className="input" value={form.password} onChange={set("password")} required minLength={6} placeholder="At least 6 characters" /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : `Create ${noun} account`}</button>
        </form>

        <div className="panel p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{users ? `${users.length} ${noun}${users.length === 1 ? "" : "s"}` : "All accounts"}</h2>
            <input className="input max-w-xs" placeholder="Search by name or username" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {!users ? <Loading /> : !users.length ? (
            <Empty title={`No ${noun}s yet`}>Use the form to create the first account.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Name</th><th>Username</th>{isStudent && <th>Roll no.</th>}<th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u._id}>
                      <td className="font-medium">{u.name}</td>
                      <td>{u.username}</td>
                      {isStudent && <td>{u.rollNo || "—"}</td>}
                      <td className="whitespace-nowrap text-right">
                        <button className="btn-ghost mr-2 px-3 py-1" onClick={() => resetPassword(u)}>Reset password</button>
                        <button className="btn-danger px-3 py-1" onClick={() => remove(u)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
