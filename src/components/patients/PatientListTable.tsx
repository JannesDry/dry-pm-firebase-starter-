"use client";

import { useEffect, useState } from "react";
import { listPatients, Patient, updatePatient } from "@/lib/patients";

type Props = { practiceId: string; };

const inputCls = "w-80 max-w-full border border-gray-300 rounded px-3 py-2 bg-white text-black";

export default function PatientListTable({ practiceId }: Props) {
  const [rows, setRows] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    if (!practiceId) { setRows([]); return; }
    const data = await listPatients(practiceId);
    setRows(data);
  }

  useEffect(() => { refresh(); }, [practiceId]);

  if (!practiceId) {
    return <div className="text-sm text-gray-700">Select a practice above to find patients.</div>;
  }

  const filtered = rows.filter((p) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [p.firstName, p.lastName, p.phone, p.email, p.memberNo]
      .some(v => (v || "").toLowerCase().includes(s)) || (p.dob || "").includes(s);
  });

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    setErr(null);
    try {
      const { id, ...rest } = editing;
      await updatePatient(practiceId, id as string, rest);
      setEditing(null);
      await refresh();
    } catch (e: any) {
      setErr(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          placeholder="Find by name, mobile, email, member no., DOB..."
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
              <th className="p-2">Actions</th>
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
                <td className="p-2">
                  <button className="rounded border px-2 py-1" onClick={() => setEditing(p)}>Edit</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-xs text-gray-700">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Simple modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded border bg-white text-black p-4 space-y-3">
            <h3 className="font-medium">Edit patient</h3>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700">First name</label>
                <input className={inputCls} value={editing.firstName}
                  onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-700">Last name</label>
                <input className={inputCls} value={editing.lastName}
                  onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-700">DOB</label>
                <input type="date" className={inputCls} value={editing.dob || ""}
                  onChange={(e) => setEditing({ ...editing, dob: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-700">Mobile</label>
                <input className={inputCls} value={editing.phone || ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-700">Email</label>
                <input type="email" className={inputCls} value={editing.email || ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-700">Visit</label>
                <select className={inputCls} value={editing.visitType || "new"}
                  onChange={(e) => setEditing({ ...editing, visitType: e.target.value as any })}>
                  <option value="new">New</option>
                  <option value="returning">Returning</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-700">Payer</label>
                <select className={inputCls} value={editing.payer || "private"}
                  onChange={(e) => setEditing({ ...editing, payer: e.target.value as any })}>
                  <option value="private">Private</option>
                  <option value="medical">Medical aid</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="rounded border px-3 py-2" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="rounded border px-3 py-2" onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
