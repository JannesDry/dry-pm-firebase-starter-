import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
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
  practiceId: string;
  createdAt?: any;
};

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

function patientsCollection(practiceId: string) {
  return collection(db, "practices", practiceId, "patients");
}

export async function findDuplicates(candidate: Patient) {
  if (!candidate.practiceId) return [];
  const c = norm(candidate);
  const scoped = patientsCollection(candidate.practiceId);
  const results: any[] = [];

  // 1) exact name+surname+dob
  if (c.firstName && c.lastName && c.dob) {
    const q1 = query(
      scoped,
      where("firstName", "==", c.firstName),
      where("lastName", "==", c.lastName),
      where("dob", "==", c.dob),
      limit(10)
    );
    results.push(...(await getDocs(q1)).docs.map(d => ({ id: d.id, ...d.data(), practiceId: candidate.practiceId })));
  }
  // 2) same phone
  if (c.phone) {
    const q2 = query(scoped, where("phone", "==", c.phone), limit(10));
    results.push(...(await getDocs(q2)).docs.map(d => ({ id: d.id, ...d.data(), practiceId: candidate.practiceId })));
  }
  // 3) same email with same full name
  if (c.email && c.firstName && c.lastName) {
    const q3 = query(
      scoped,
      where("email", "==", c.email),
      where("firstName", "==", c.firstName),
      where("lastName", "==", c.lastName),
      limit(10)
    );
    results.push(...(await getDocs(q3)).docs.map(d => ({ id: d.id, ...d.data(), practiceId: candidate.practiceId })));
  }

  // unique by id
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export async function listPatients(practiceId: string) {
  if (!practiceId) return [];
  const qScoped = query(
    patientsCollection(practiceId),
    orderBy("createdAt", "desc"),
    limit(500)
  );
  const snap = await getDocs(qScoped);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), practiceId })) as Patient[];
}

export async function createPatient(data: Patient) {
  if (!data.practiceId) throw new Error("Select a practice first.");
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
  await addDoc(patientsCollection(data.practiceId), toSave as any);
}
