'use client';
import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/require-auth";
import { Button, Card, Input, Label } from "@/components/ui";
import { db } from "@/lib/firebase";
import {
  addDoc, collection, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc
} from "firebase/firestore";
import { format } from "date-fns";
import { usePractice } from "@/components/practice-context";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt?: any;
};

export default function PatientsPage() {
  const router = useRouter();
  const { selectedId, practices } = usePractice();

  // Which practice are we viewing? Defaults to the working practice.
  const [viewPracticeId, setViewPracticeId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) { router.push('/practice'); return; }
    setViewPracticeId(prev => prev ?? selectedId);
  }, [selectedId, router]);

  // Read-only if viewing a practice different from the working practice
  const readOnly = useMemo(
    () => !!selectedId && !!viewPracticeId && viewPracticeId !== selectedId,
    [selectedId, viewPracticeId]
  );

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', phone: '', email: '' });

  // Edit modal state
  const [editing, setEditing] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', dob: '', phone: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);

  // Load patients for the practice we're viewing
  useEffect(() => {
    if (!viewPracticeId) return;
    const path = `practices/${viewPracticeId}/patients`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const rows: Patient[] = [];
      snap.forEach(doc => rows.push({ id: doc.id, ...(doc.data() as any) }));
      setPatients(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [viewPracticeId]);

  async function createPatient(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || readOnly) return; // only create in working practice
    const path = `practices/${selectedId}/patients`;
    await addDoc(collection(db, path), {
      ...form,
      createdAt: serverTimestamp(),
    });
    setForm({ firstName: '', lastName: '', dob: '', phone: '', email: '' });
    alert('Patient created');
  }

  function openEdit(p: Patient) {
    setEditing(p);
    setEditForm({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      dob: (p.dob as any) || '',
      phone: p.phone || '',
      email: p.email || '',
      notes: p.notes || ''
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !selectedId) return;
    if (readOnly) return; // block edits when not in working practice

    setSaving(true);
    try {
      const ref = doc(db, `practices/${selectedId}/patients/${editing.id}`);
      await updateDoc(ref, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        dob: editForm.dob || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
        notes: editForm.notes || null,
      });
      setEditing(null);
      alert('Patient updated');
    } catch (err: any) {
      alert('Update failed: ' + (err?.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  }

  if (!selectedId) return null;

  return (
    <RequireAuth>
      {/* Viewer control */}
      <div className="mb-4 flex items-center gap-3">
        <div className="text-sm text-gray-600">Viewing:</div>
        <select
          className="rounded-xl border px-3 py-2 text-sm"
          value={viewPracticeId ?? ''}
          onChange={e => setViewPracticeId(e.target.value)}
        >
          {(practices ?? []).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {readOnly && (
          <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-800">
            Read-only (switch working practice to edit)
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create form */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Add Patient</h2>
          <form className="space-y-3" onSubmit={createPatient}>
            <div>
              <Label>First name</Label>
              <Input
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                required
                disabled={readOnly}
              />
            </div>
            <div>
              <Label>Last name</Label>
              <Input
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                required
                disabled={readOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date of birth</Label>
                <Input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm({ ...form, dob: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  disabled={readOnly}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <Button type="submit" disabled={readOnly}>Create</Button>
            {readOnly && <p className="mt-2 text-xs text-gray-500">You can only add/edit in your working practice.</p>}
          </form>
        </Card>

        {/* List + Edit action */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Patients</h2>
          {loading ? <p>Loading…</p> : (
            <div className="max-h-[420px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                      <td className="px-3 py-2">{p.firstName} {p.lastName}</td>
                      <td className="px-3 py-2">{p.phone || '-'}</td>
                      <td className="px-3 py-2">{p.email || '-'}</td>
                      <td className="px-3 py-2">
                        {p.createdAt?.toDate ? format(p.createdAt.toDate(), "yyyy-MM-dd") : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <Button onClick={() => openEdit(p)} disabled={readOnly}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Edit Patient</h3>
            <form className="space-y-3" onSubmit={saveEdit}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First name</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date of birth</Label>
                  <Input
                    type="date"
                    value={editForm.dob}
                    onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button type="submit" disabled={saving || readOnly}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" className="bg-gray-200 text-gray-900" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
              {readOnly && <p className="mt-2 text-xs text-gray-500">Read-only: switch working practice to edit.</p>}
            </form>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
