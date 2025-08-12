"use client";

import { useEffect, useState } from "react";
import PatientRegisterForm from "@/components/patients/PatientRegisterForm";
import PatientListTable from "@/components/patients/PatientListTable";
import { listPractices, type Practice } from "@/lib/practices";

export default function PatientsPage() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [practiceId, setPracticeId] = useState<string>("__all__");
  const [tab, setTab] = useState<"find" | "register">("find");

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
          <h1 className="text-lg font-semibold">Patients</h1>
          <select
            value={practiceId}
            onChange={(e) => setPracticeId(e.target.value)}
            /* Plain select: no custom colors */
          >
            <option value="__all__">All practices</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500">Data path: practices/&lt;practiceId&gt;/patients</span>
        </div>

        <div className="flex gap-2">
          <button
            className={`rounded border px-3 py-1.5 ${tab === "find" ? "" : ""}`}
            onClick={() => setTab("find")}
          >
            Find / View
          </button>
          <button
            className={`rounded border px-3 py-1.5 ${tab === "register" ? "" : ""}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>
      </div>

      {tab === "find" && (
        <div className="rounded-xl border border-slate-300/20 p-4">
          <PatientListTable practiceId={practiceId} />
        </div>
      )}

      {tab === "register" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-300/20 p-4">
            <h2 className="mb-2 font-medium">Register new patient</h2>
            <PatientRegisterForm
              practiceId={practiceId === "__all__" ? (practices[0]?.id || "") : practiceId}
              onSaved={() => setTab("find")}
            />
          </div>

          <div className="rounded-xl border border-slate-300/20 p-4">
            <h2 className="mb-2 font-medium">Duplicate check</h2>
            <p className="text-xs text-slate-500">
              Duplicates are detected automatically on save. You can also use “Check duplicates” in the form to preview potential matches.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
