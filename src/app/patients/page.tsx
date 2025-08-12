"use client";

import { useState } from "react";
import PatientRegisterForm from "@/components/patients/PatientRegisterForm";
import PatientListTable from "@/components/patients/PatientListTable";

const PRACTICES = [
  { id: "__all__", name: "All practices" },
  { id: "peacemed", name: "Peacemed" },
  { id: "central", name: "Central Clinic" }
];

export default function PatientsPage() {
  const [practiceId, setPracticeId] = useState(PRACTICES[0].id);
  const [tab, setTab] = useState<"find" | "register">("find");

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Patients</h1>
          <select
            value={practiceId}
            onChange={(e) => setPracticeId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 p-2"
          >
            {PRACTICES.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">Switch to "All practices" to see legacy patients without a practiceId.</span>
        </div>

        <div className="flex gap-2">
          <button
            className={`rounded-lg border px-3 py-1.5 ${tab === "find" ? "border-sky-600 text-white bg-sky-700" : "border-slate-700"}`}
            onClick={() => setTab("find")}
          >
            Find / View
          </button>
          <button
            className={`rounded-lg border px-3 py-1.5 ${tab === "register" ? "border-sky-600 text-white bg-sky-700" : "border-slate-700"}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>
      </div>

      {tab === "find" && (
        <div className="rounded-xl border border-slate-800 p-4">
          <PatientListTable practiceId={practiceId} />
        </div>
      )}

      {tab === "register" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 p-4">
            <h2 className="mb-2 font-medium">Register new patient</h2>
            <PatientRegisterForm
              practiceId={practiceId === "__all__" ? "peacemed" : practiceId}
              onSaved={() => setTab("find")}
            />
          </div>

          <div className="rounded-xl border border-amber-500/40 p-4">
            <h2 className="mb-2 font-medium">Duplicate check</h2>
            <p className="text-xs text-slate-400">
              Duplicates are detected automatically on save. You can also use “Check duplicates” in the form to preview potential matches.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
