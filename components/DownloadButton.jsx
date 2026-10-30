"use client";

import { useState } from "react";

// Downloads a file from an API route and shows the server's message if it fails.
export default function DownloadButton({ href, children, className = "btn-ghost", title }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(href);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const match = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match ? match[1] : "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      alert(e.message);
    }
    setBusy(false);
  }

  return (
    <button type="button" onClick={download} disabled={busy} className={className} title={title}>
      {busy ? "Preparing…" : children}
    </button>
  );
}
