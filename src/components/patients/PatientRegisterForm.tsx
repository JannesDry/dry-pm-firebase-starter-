"use client";

import { useState } from "react";
import { createPatient, findDuplicates, Patient } from "@/lib/patients";

type Props = {
  practiceId: string; // must be selected in parent
  onSaved?: () => void;
};

const inputCls = "w-full border border-gray-300 rounded px-3 py-2 bg-white text-black";
const selectCls = "w-full border border-gray-300 rounded px-3 py-2 bg-white text-black";

export default function PatientRegisterForm({ practiceId, onSaved }: Props) {
  const disabled = !practiceId;

  const [form, setForm] = useState<Patient>({
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
    visitType: "new",
    payer: "private",
    medAidName: "",
    medAidPlan: "",
    memberNo: "",
    dependentNo: "",
    practiceId: "" // set from prop at submit
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupes, setDupes] = useState<any[]>([]);

  const set = (k: keyof Patient, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleCheckDupes() {
    if (!practiceId) { setError("Select a practice first."); return; }
    setError(null);
    setDupes([]);
    try {
      const res = await findDuplicates({ ...form, practiceId });
      setDupes(res);
      if (res.length === 0) setError("No duplicates found.");
    } catch (e: any) {
      setError(e.message || "Error while checking duplicates.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!practiceId) { setError("Select a practice first."); return; }
    setSaving(true);
    setError(null);
    try {
      await createPatient({ ...form, practiceId });
      onSaved?.();
      setForm({
        firstName: "",
        lastName: "",
        dob: "",
        phone: "",
        email: "",
        address: "",
        visitType: "new",
        payer: "private",
        medAidName: "",
        medAidPlan: "",
        memberNo: "",
        dependentNo: "",
        practiceId: ""
      });
      setDupes([]);
    } catch (e: any) {
      setError(e.message || "Failed to save patient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-700">First name</label>
          <input className={inputCls} disabled={disabled}
                 value={form.firstName} onChange={e => set("firstName", e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-gray-700">Last name</label>
          <input className={inputCls} disabled={disabled}
                 value={form.lastName} onChange={e => set("lastName", e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-gray-700">Date of birth</label>
          <input type="date" className={inputCls} disabled={disabled}
                 value={form.dob} onChange={e => set("dob", e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-gray-700">Mobile</label>
          <input className={inputCls} disabled={disabled} placeholder="+27..."
                 value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-700">Email</label>
          <input type="email" className={inputCls} disabled={disabled}
                 value={form.email || ""} onChange={e => set("email", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-700">Visit type</label>
          <select className={selectCls} disabled={disabled}
                  value={form.visitType} onChange={e => set("visitType", e.target.value)}>
            <option value="new">New</option>
            <option value="returning">Returning</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-700">Patient type</label>
          <select className={selectCls} disabled={disabled}
                  value={form.payer} onChange={e => set("payer", e.target.value)}>
            <option value="private">Private</option>
            <option value="medical">Medical aid</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-700">Physical address</label>
          <input className={inputCls} disabled={disabled}
                 value={form.address || ""} onChange={e => set("address", e.target.value)} />
        </div>
        {form.payer === "medical" && !disabled && (
          <>
            <div>
              <label className="text-xs text-gray-700">Medical aid name</label>
              <input className={inputCls}
                    value={form.medAidName || ""} onChange={e => set("medAidName", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-gray-700">Medical aid plan</label>
              <input className={inputCls}
                    value={form.medAidPlan || ""} onChange={e => set("medAidPlan", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-gray-700">Member number</label>
              <input className={inputCls}
                    value={form.memberNo || ""} onChange={e => set("memberNo", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-gray-700">Dependent number</label>
              <input className={inputCls}
                    value={form.dependentNo || ""} onChange={e => set("dependentNo", e.target.value)} required />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={handleCheckDupes} disabled={disabled}
                className="rounded border px-3 py-2">
          Check duplicates
        </button>
        <button type="submit" disabled={disabled || saving}
                className="rounded border px-4 py-2">
          {saving ? "Saving..." : "Save patient"}
        </button>
      </div>

      {disabled && <p className="text-xs text-gray-700">Select a practice above to enable registration.</p>}
      {error && <p className="text-sm text-amber-700 whitespace-pre-wrap">{error}</p>}

      {dupes.length > 0 && (
        <div className="mt-3 border rounded p-3 bg-white text-black">
          <p className="text-sm mb-2">Potential duplicates — please review:</p>
          <ul className="space-y-1 text-sm">
            {dupes.map((d: any) => (
              <li key={d.id}>
                {d.firstName} {d.lastName} — DOB {d.dob || "-"} — {d.phone || d.email || ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
