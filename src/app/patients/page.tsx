'use client';
import { useEffect, useState } from "react";
import RequireAuth from "@/components/require-auth";
import { Button, Card, Input, Label } from "@/components/ui";
import { db } from "@/lib/firebase";
import {
  addDoc, collection, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc
} from "firebase/firestore";
import { format } from "date-fns";

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', phone: '', email: '' });

  // edit modal state
  const [editing, setEditing] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', dob: '', phone: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const rows: Patient[] = [];
      snap.forEach(d => rows.push({ id: d.id, ...(d.data() as any) }));
      setPatients(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function createPatient(e: React.FormEvent) {
    e.preventDefault();
    await addDoc(collection(db, 'patients'), {
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
    if (!editing) return;
    setSaving(true);
    try {
      const ref = doc(db, 'patients', editing.id);
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

  return (
    <RequireAuth>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Add Patient</h2>
          <form className="space-y-3" onSubmit={createPatient}>
            <div>
              <Label>First name</Label>
              <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <Label>Last name</Label>
              <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date of birth</Label>
                <Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </Card>

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
                        <Button onClick={() => openEdit(p)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Simple edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Edit Patient</h3>
            <form className="space-y-3" onSubmit={saveEdit}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First name</Label>
                  <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date of birth</Label>
                  <Input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                <Button type="button" className="bg-gray-200 text-gray-900" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
