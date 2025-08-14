"use client";

import { useEffect, useState } from "react";
import { listPatients, Patient } from "@/lib/patients";

type Props = {
  practiceId: string;
};

const inputCls = "w-80 max-w-full border border-gray-300 rounded px-3 py-2 bg-white text-black";

export default function PatientListTable({ practiceId }: Props) {
  const [rows, setRows] = useState<Patient[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!practiceId) { setRows([]); return; }
    (async () => {
      const data = await listPatients(practiceId);
      setRows(data);
    })();
  }, [practiceId]);

  if (!practiceId) {
    return <div className="text-sm text-gray-700">Select a practice above to view patients.</div>;
  }

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
          className={inputCls}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="text-xs text-gray-700">{filtered.length} / {rows.length} patients</span>
      </div>
      <div className="overflow-x-auto rounded border bg-white text-black">
        <table className="min-w-full text-sm">
          <thead>
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
              <tr key={p.id}>
                <td className="p-2">{p.firstName} {p.lastName}</td>
                <td className="p-2">{p.dob || "-"}</td>
                <td className="p-2">{p.phone || "-"}</td>
                <td className="p-2">{p.email || "-"}</td>
                <td className="p-2"><span className="rounded border px-2 py-0.5 text-xs bg-white text-black">{p.payer}</span></td>
                <td className="p-2">{p.visitType}</td>
                <td className="p-2 text-gray-700">{/* createdAt optional */}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-xs text-gray-700">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
