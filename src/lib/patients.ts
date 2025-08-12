import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Patient = {
  id?: string;
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  phone?: string;
  email?: string;
  address?: string;
  visitType?: "new" | "returning";
  payer?: "private" | "medical";
  medAidName?: string;
  medAidPlan?: string;
  memberNo?: string;
  dependentNo?: string;
  practiceId?: string; // made optional for legacy docs
  createdAt?: any;
};

const patientsCol = collection(db, "patients");

const cleanPhone = (s?: string) => (s || "").replace(/\D/g, "");

function norm(x: Partial<Patient>) {
  const lower = (s?: string) => (s || "").trim().toLowerCase();
  return {
    firstName: lower(x.firstName),
    lastName: lower(x.lastName),
    dob: (x.dob || "").trim(),
    phone: cleanPhone(x.phone),
    email: lower(x.email)
  };
}

export async function findDuplicates(candidate: Patient) {
  const c = norm(candidate);
  const results: any[] = [];

  // If legacy docs don't have practiceId, we still check without it as a very last resort.
  const practiceFilter = candidate.practiceId ? [where("practiceId", "==", candidate.practiceId)] : [];

  // 1) exact name+surname+dob
  if (c.firstName && c.lastName && c.dob) {
    const q1 = query(patientsCol,
      where("firstName", "==", c.firstName),
      where("lastName", "==", c.lastName),
      where("dob", "==", c.dob),
      ...practiceFilter,
      limit(10)
    );
    results.push(...(await getDocs(q1)).docs.map(d => ({ id: d.id, ...d.data() })));
  }

  // 2) same phone
  if (c.phone) {
    const q2 = query(patientsCol,
      where("phone", "==", c.phone),
      ...practiceFilter,
      limit(10)
    );
    results.push(...(await getDocs(q2)).docs.map(d => ({ id: d.id, ...d.data() })));
  }

  // 3) same email with same full name
  if (c.email && c.firstName && c.lastName) {
    const q3 = query(patientsCol,
      where("email", "==", c.email),
      where("firstName", "==", c.firstName),
      where("lastName", "==", c.lastName),
      ...practiceFilter,
      limit(10)
    );
    results.push(...(await getDocs(q3)).docs.map(d => ({ id: d.id, ...d.data() })));
  }

  // de-dup array by id
  const seen = new Set<string>();
  const uniq = results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  if (uniq.length === 0 && practiceFilter.length) {
    // Final legacy fallback: try again without practice scope
    return findDuplicates({ ...candidate, practiceId: undefined } as Patient);
  }

  return uniq;
}

export async function listPatients(practiceId: string) {
  // If "__all__", show all patients (legacy + new). Keep order simple to avoid index needs.
  if (practiceId === "__all__") {
    const qAll = query(patientsCol, orderBy("firstName", "asc"), limit(1000));
    const snapAll = await getDocs(qAll);
    return snapAll.docs.map(d => ({ id: d.id, ...d.data() })) as Patient[];
  }

  // Try scoped by practiceId first (new schema)
  const qScoped = query(
    patientsCol,
    where("practiceId", "==", practiceId),
    orderBy("createdAt", "desc"),
    limit(500)
  );
  const snapScoped = await getDocs(qScoped);
  const data = snapScoped.docs.map(d => ({ id: d.id, ...d.data() })) as Patient[];
  if (data.length > 0) return data;

  // Legacy fallback (no practiceId field)
  const qLegacy = query(patientsCol, orderBy("firstName", "asc"), limit(1000));
  const snapLegacy = await getDocs(qLegacy);
  return snapLegacy.docs.map(d => ({ id: d.id, ...d.data() })) as Patient[];
}

export async function createPatient(data: Patient) {
  // preflight duplicate check
  const dupes = await findDuplicates(data);
  if (dupes.length > 0) {
    const details = dupes.map(d => `${d.firstName} ${d.lastName} — DOB ${d.dob || "-"} — ${d.phone || d.email || ""}`).join("\n");
    throw new Error(`Potential duplicate(s) found:\n${details}`);
  }

  const toSave: Patient = {
    ...data,
    firstName: (data.firstName || "").trim().toLowerCase(),
    lastName: (data.lastName || "").trim().toLowerCase(),
    dob: (data.dob || "").trim(),
    phone: cleanPhone(data.phone),
    email: (data.email || "").trim().toLowerCase(),
    createdAt: serverTimestamp()
  };

  await addDoc(patientsCol, toSave as any);
}
