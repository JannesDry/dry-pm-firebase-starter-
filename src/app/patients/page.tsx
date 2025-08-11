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

/** ─────────────────────── Types ─────────────────────── */
type MedicalAid = {
  scheme?: string | null;
  plan?: string | null;
  memberNumber?: string | null;
  dependentNumber?: string | null;
};

type Address = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt?: any;

  // New fields
  payerType?: "private" | "medical_aid";
  medicalAid?: MedicalAid;
  address?: Address;
  visitType?: "new" | "returning";
};

/** ─────────────────────── Page ─────────────────────── */
export default function PatientsPage() {
  const router = useRouter();
  const { selectedId, practices } = usePractice();

  // Which practice are we viewing? Defaults to the working practice.
  const [viewPracticeId, setViewPracticeId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) { router.push('/'); return; }
    setViewPracticeId(prev => prev ?? selectedId);
  }, [selectedId, router]);

  // Read-only if viewing a practice different from the working practice
  const readOnly = useMemo(
    () => !!selectedId && !!viewPracticeId && viewPracticeId !== selectedId,
    [selectedId, viewPracticeId]
  );

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  /** Create form state (incl. new fields) */
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    email: '',
    payerType: 'private' as "private" | "medical_aid",
    medicalAid: {
      scheme: '',
      plan: '',
      memberNumber: '',
      dependentNumber: '',
    } as MedicalAid,
    address: {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
    } as Address,
    visitType: 'new' as "new" | "returning",
    notes: '',
  });

  // Edit modal state
  const [editing, setEditing] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    email: '',
    payerType: 'private' as "private" | "medical_aid",
    medicalAid: {
      scheme: '',
      plan: '',
      memberNumber: '',
      dependentNumber: '',
    } as MedicalAid,
    address: {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
    } as Address,
    visitType: 'new' as "new" | "returning",
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  /** Load patients for the practice we're viewing */
  useEffect(() => {
    if (!viewPracticeId) return;
    const path = `practices/${viewPracticeId}/patients`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const rows: Patient[] = [];
      snap.forEach(doc => rows.push({ id: doc.id, ...(doc.data() as any) }));
      setPatients(rows);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [viewPracticeId]);

  /** Create patient */
  async function createPatient(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || readOnly) return;
    const path = `practices/${selectedId}/patients`;

    // If private, blank out medicalAid fields to keep data clean
    const medicalAid = form.payerType === 'medical_aid' ? form.medicalAid : {
      scheme: null,
      plan: null,
      memberNumber: null,
      dependentNumber: null,
    };

    await addDoc(collection(db, path), {
      firstName: form.firstName,
      lastName: form.lastName,
      dob: form.dob || null,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
      createdAt: serverTimestamp(),

      payerType: form.payerType,
      medicalAid,
      address: {
        line1: form.address.line1 || null,
        line2: form.address.line2 || null,
        city: form.address.city || null,
        postalCode: form.address.postalCode || null,
      },
      visitType: form.visitType,
    });

    setForm({
      firstName: '',
      lastName: '',
      dob: '',
      phone: '',
      email: '',
      payerType: 'private',
      medicalAid: { scheme: '', plan: '', memberNumber: '', dependentNumber: '' },
      address: { line1: '', line2: '', city: '', postalCode: '' },
      visitType: 'new',
      notes: '',
    });
    alert('Patient created');
  }

  /** Open edit modal */
  function openEdit(p: Patient) {
    setEditing(p);
    setEditForm({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      dob: (p.dob as any) || '',
      phone: p.phone || '',
      email: p.email || '',
      payerType: (p.payerType as any) || 'private',
      medicalAid: {
        scheme: p.medicalAid?.scheme || '',
        plan: p.medicalAid?.plan || '',
        memberNumber: p.medicalAid?.memberNumber || '',
        dependentNumber: p.medicalAid?.dependentNumber || '',
      },
      address: {
        line1: p.address?.line1 || '',
        line2: p.address?.line2 || '',
        city: p.address?.city || '',
        postalCode: p.address?.postalCode || '',
      },
      visitType: (p.visitType as any) || 'new',
      notes: p.notes || '',
    });
  }

  /** Save edits */
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !selectedId || readOnly) return;
    setSaving(true);
    try {
      const ref = doc(db, `practices/${selectedId}/patients/${editing.id}`);

      const medicalAid = editForm.payerType === 'medical_aid' ? editForm.medicalAid : {
        scheme: null, plan: null, memberNumber: null, dependentNumber: null,
      };

      await updateDoc(ref, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        dob: editForm.dob || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
        notes: editForm.notes || null,

        payerType: editForm.payerType,
        medicalAid,
        address: {
          line1: editForm.address.line1 || null,
          line2: editForm.address.line2 || null,
          city: editForm.address.city || null,
          postalCode: editForm.address.postalCode || null,
        },
        visitType: editForm.visitType,
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

  /** ─────────────────────── UI ─────────────────────── */
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
            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payer type</Label>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={form.payerType}
                  onChange={e => setForm({ ...form, payerType: e.target.value as any })}
                  disabled={readOnly}
                >
                  <option value="private">Private</option>
                  <option value="medical_aid">Medical Aid</option>
                </select>
              </div>
              <div>
                <Label>Visit type</Label>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={form.visitType}
                  onChange={e => setForm({ ...form, visitType: e.target.value as any })}
                  disabled={readOnly}
                >
                  <option value="new">New visit</option>
                  <option value="returning">Returning visit</option>
                </select>
              </div>
            </div>

            {form.payerType === 'medical_aid' && (
              <div className="rounded-lg border p-3">
                <div className="mb-2 font-medium text-sm">Medical Aid details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Scheme</Label>
                    <Input
                      value={form.medicalAid.scheme ?? ''}
                      onChange={e =>
                        setForm({ ...form, medicalAid: { ...form.medicalAid, scheme: e.target.value } })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Input
                      value={form.medicalAid.plan ?? ''}
                      onChange={e =>
                        setForm({ ...form, medicalAid: { ...form.medicalAid, plan: e.target.value } })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Member #</Label>
                    <Input
                      value={form.medicalAid.memberNumber ?? ''}
                      onChange={e =>
                        setForm({ ...form, medicalAid: { ...form.medicalAid, memberNumber: e.target.value } })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Dependent #</Label>
                    <Input
                      value={form.medicalAid.dependentNumber ?? ''}
                      onChange={e =>
                        setForm({ ...form, medicalAid: { ...form.medicalAid, dependentNumber: e.target.value } })
                      }
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border p-3">
              <div className="mb-2 font-medium text-sm">Address (for invoices)</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Line 1</Label>
                  <Input
                    value={form.address.line1 ?? ''}
                    onChange={e => setForm({ ...form, address: { ...form.address, line1: e.target.value } })}
                    disabled={readOnly}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Line 2</Label>
                  <Input
                    value={form.address.line2 ?? ''}
                    onChange={e => setForm({ ...form, address: { ...form.address, line2: e.target.value } })}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={form.address.city ?? ''}
                    onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input
                    value={form.address.postalCode ?? ''}
                    onChange={e => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
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
                    <th className="px-3 py-2 text-left">Payer</th>
                    <th className="px-3 py-2 text-left">Visit</th>
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
                      <td className="px-3 py-2">{p.payerType === 'medical_aid' ? 'Medical Aid' : 'Private'}</td>
                      <td className="px-3 py-2">{p.visitType === 'returning' ? 'Returning' : 'New'}</td>
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
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
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
                  <Label>Payer type</Label>
                  <select
                    className="w-full rounded-lg border px-3 py-2"
                    value={editForm.payerType}
                    onChange={e => setEditForm({ ...editForm, payerType: e.target.value as any })}
                    disabled={readOnly}
                  >
                    <option value="private">Private</option>
                    <option value="medical_aid">Medical Aid</option>
                  </select>
                </div>
                <div>
                  <Label>Visit type</Label>
                  <select
                    className="w-full rounded-lg border px-3 py-2"
                    value={editForm.visitType}
                    onChange={e => setEditForm({ ...editForm, visitType: e.target.value as any })}
                    disabled={readOnly}
                  >
                    <option value="new">New visit</option>
                    <option value="returning">Returning visit</option>
                  </select>
                </div>
              </div>

              {editForm.payerType === 'medical_aid' && (
                <div className="rounded-lg border p-3">
                  <div className="mb-2 font-medium text-sm">Medical Aid details</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Scheme</Label>
                      <Input
                        value={editForm.medicalAid.scheme ?? ''}
                        onChange={e => setEditForm({ ...editForm, medicalAid: { ...editForm.medicalAid, scheme: e.target.value } })}
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <Input
                        value={editForm.medicalAid.plan ?? ''}
                        onChange={e => setEditForm({ ...editForm, medicalAid: { ...editForm.medicalAid, plan: e.target.value } })}
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Member #</Label>
                      <Input
                        value={editForm.medicalAid.memberNumber ?? ''}
                        onChange={e => setEditForm({ ...editForm, medicalAid: { ...editForm.medicalAid, memberNumber: e.target.value } })}
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Dependent #</Label>
                      <Input
                        value={editForm.medicalAid.dependentNumber ?? ''}
                        onChange={e => setEditForm({ ...editForm, medicalAid: { ...editForm.medicalAid, dependentNumber: e.target.value } })}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border p-3">
                <div className="mb-2 font-medium text-sm">Address (for invoices)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Line 1</Label>
                    <Input
                      value={editForm.address.line1 ?? ''}
                      onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, line1: e.target.value } })}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Line 2</Label>
                    <Input
                      value={editForm.address.line2 ?? ''}
                      onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, line2: e.target.value } })}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={editForm.address.city ?? ''}
                      onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Postal code</Label>
                    <Input
                      value={editForm.address.postalCode ?? ''}
                      onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, postalCode: e.target.value } })}
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Input
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  disabled={readOnly}
                />
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
