"use client";

// Small fetch wrapper for client components: returns JSON or throws Error(message)
export async function api(url, { method = "GET", body, form } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login";
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    Object.assign(err, { status: res.status, data });
    throw err;
  }
  return data;
}
