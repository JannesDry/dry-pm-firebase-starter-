'use client';
import { useEffect, useState } from "react";
import RequireAuth from "@/components/require-auth";
import { Button, Card, Input, Label } from "@/components/ui";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
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

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const rows: Patient[] = [];
      snap.forEach(doc => rows.push({ id: doc.id, ...(doc.data() as any) }));
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </RequireAuth>
  );
}
