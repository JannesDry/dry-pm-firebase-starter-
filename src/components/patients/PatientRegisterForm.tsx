"use client";

import { useState } from "react";
import { createPatient, findDuplicates, Patient } from "@/lib/patients";

type Props = {
  practiceId: string;
  onSaved?: () => void;
};

export default function PatientRegisterForm({ practiceId, onSaved }: Props) {
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
    practiceId
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupes, setDupes] = useState<any[]>([]);

  const set = (k: keyof Patient, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleCheckDupes() {
    setError(null);
    setDupes([]);
    try {
      const res = await findDuplicates(form);
      setDupes(res);
      if (res.length === 0) setError("No duplicates found.");
    } catch (e: any) {
      setError(e.message || "Error while checking duplicates.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createPatient(form);
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
        practiceId
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
          <label className="text-xs text-slate-400">First name</label>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                 value={form.firstName} onChange={e => set("firstName", e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Last name</label>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                 value={form.lastName} onChange={e => set("lastName", e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Date of birth</label>
          <input type="date" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                 value={form.dob} onChange={e => set("dob", e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-slate-400">Mobile</label>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                 placeholder="+27..." value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Email</label>
          <input type="email" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                 value={form.email || ""} onChange={e => set("email", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Visit type</label>
          <select className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                  value={form.visitType} onChange={e => set("visitType", e.target.value)}>
            <option value="new">New</option>
            <option value="returning">Returning</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Patient type</label>
          <select className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                  value={form.payer} onChange={e => set("payer", e.target.value)}>
            <option value="private">Private</option>
            <option value="medical">Medical aid</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Physical address</label>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                 value={form.address || ""} onChange={e => set("address", e.target.value)} />
        </div>
        {form.payer === "medical" && (
          <>
            <div>
              <label className="text-xs text-slate-400">Medical aid name</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={form.medAidName || ""} onChange={e => set("medAidName", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-slate-400">Medical aid plan</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={form.medAidPlan || ""} onChange={e => set("medAidPlan", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-slate-400">Member number</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={form.memberNo || ""} onChange={e => set("memberNo", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-slate-400">Dependent number</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={form.dependentNo || ""} onChange={e => set("dependentNo", e.target.value)} required />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={handleCheckDupes} className="rounded-xl border border-slate-700 px-3 py-2">
          Check duplicates
        </button>
        <button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-4 py-2 text-white">
          {saving ? "Saving..." : "Save patient"}
        </button>
      </div>

      {error && <p className="text-sm text-amber-400 whitespace-pre-wrap">{error}</p>}

      {dupes.length > 0 && (
        <div className="mt-3 border border-amber-500/40 rounded-xl p-3">
          <p className="text-amber-400 text-sm mb-2">Potential duplicates — please review:</p>
          <ul className="space-y-1 text-sm">
            {dupes.map((d: any) => (
              <li key={d.id} className="opacity-90">
                {d.firstName} {d.lastName} — DOB {d.dob || "-"} — {d.phone || d.email || ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

