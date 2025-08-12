"use client";

import { useEffect, useState } from "react";
import { listPatients, Patient } from "@/lib/patients";

type Props = {
  practiceId: string;
};

export default function PatientListTable({ practiceId }: Props) {
  const [rows, setRows] = useState<Patient[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const data = await listPatients(practiceId);
      setRows(data);
    })();
  }, [practiceId]);

  const filtered = rows.filter((p) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [
      p.firstName, p.lastName, p.phone, p.email, p.memberNo
    ].some(v => (v || "").toLowerCase().includes(s)) || (p.dob || "").includes(s);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          placeholder="Search name, mobile, email, member no., DOB..."
          className="w-80 max-w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="text-xs text-slate-400">{filtered.length} / {rows.length} patients</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/60">
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">DOB</th>
              <th className="p-2">Mobile</th>
              <th className="p-2">Email</th>
              <th className="p-2">Payer</th>
              <th className="p-2">Visit</th>
              <th className="p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-800/70">
                <td className="p-2">{p.firstName} {p.lastName}</td>
                <td className="p-2">{p.dob || "-"}</td>
                <td className="p-2">{p.phone || "-"}</td>
                <td className="p-2">{p.email || "-"}</td>
                <td className="p-2"><span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs">{p.payer}</span></td>
                <td className="p-2">{p.visitType}</td>
                <td className="p-2 opacity-70">{/* createdAt via Firestore */}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-xs text-slate-400">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

