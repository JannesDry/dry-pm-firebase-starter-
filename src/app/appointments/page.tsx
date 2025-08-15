"use client";

import { useEffect, useState, useRef } from "react";
import { listPractices, type Practice } from "@/lib/practices";

const DEFAULT_SETMORE_URL = "https://go.setmore.com";

export default function AppointmentsPage() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [practiceId, setPracticeId] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    (async () => {
      const rows = await listPractices();
      setPractices(rows);
    })();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Appointments — Setmore Staff View</h1>
          <select
            value={practiceId}
            onChange={(e) => setPracticeId(e.target.value)}
            className="border rounded px-3 py-2 bg-white text-black"
          >
            <option value="">Select a practice…</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-700">This view is for internal use only</span>
        </div>
        <div>
          <a
            href={DEFAULT_SETMORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border rounded px-3 py-1.5 bg-white text-black"
          >
            Open in new tab
          </a>
        </div>
      </div>

      <div className="rounded border bg-white text-black overflow-hidden">
        <div className="px-3 py-2 text-xs text-gray-700 border-b bg-gray-50">
          If the embed does not load, use the "Open in new tab" button above.
        </div>
        <div className="relative min-h-[75vh]">
          <iframe
            ref={iframeRef}
            src={DEFAULT_SETMORE_URL}
            className="absolute inset-0 w-full h-full"
            allow="clipboard-write; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
