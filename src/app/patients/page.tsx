"use client";

import { useEffect, useState } from "react";
import PatientRegisterForm from "@/components/patients/PatientRegisterForm";
import PatientListTable from "@/components/patients/PatientListTable";
import { listPractices, type Practice } from "@/lib/practices";

export default function PatientsPage() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [practiceId, setPracticeId] = useState<string>(""); // must be selected
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
            className="border rounded px-3 py-2 bg-white text-black"
          >
            <option value="">Select a practice…</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-700">Data: practices/&lt;practiceId&gt;/patients</span>
        </div>

        <div className="flex gap-2">
          <button
            className={`rounded border px-3 py-1.5 bg-white text-black`}
            onClick={() => setTab("find")}
          >
            Find
          </button>
          <button
            className={`rounded border px-3 py-1.5 bg-white text-black`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>
      </div>

      {tab === "find" && (
        <div className="rounded border p-4 bg-white text-black">
          <PatientListTable practiceId={practiceId} />
        </div>
      )}

      {tab === "register" && (
        <div className="rounded border p-4 bg-white text-black">
          <h2 className="mb-2 font-medium">Register new patient</h2>
          <PatientRegisterForm
            practiceId={practiceId}
            onSaved={() => setTab("find")}
          />
          {!practiceId && <p className="text-xs text-gray-700 mt-2">Select a practice to enable the form.</p>}
        </div>
      )}
    </div>
  );
}
