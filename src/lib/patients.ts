import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc
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
  firstNameLower?: string;
  lastNameLower?: string;
};

const cleanPhone = (s?: string) => (s || "").replace(/\D/g, "");

// Basic Title Case (per word). We can enhance later for "van der" etc.
const toTitleCase = (str?: string) =>
  (str || "")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

function norm(x: Partial<Patient>) {
  const lower = (s?: string) => (s || "").trim().toLowerCase();
  return {
    firstName: lower(x.firstName),
    lastName: lower(x.lastName),
    dob: (x.dob || "").trim(),
    phone: cleanPhone(x.phone),
    email: lower(x.email),
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

  // 1) Case-insensitive match on full name + DOB
  if (c.firstName && c.lastName && c.dob) {
    const q1 = query(
      scoped,
      where("firstNameLower", "==", c.firstName),
      where("lastNameLower", "==", c.lastName),
      where("dob", "==", c.dob),
      limit(10)
    );
    results.push(...(await getDocs(q1)).docs.map(d => ({ id: d.id, ...d.data(), practiceId: candidate.practiceId })));
  }

  // 2) Same phone
  if (c.phone) {
    const q2 = query(scoped, where("phone", "==", c.phone), limit(10));
    results.push(...(await getDocs(q2)).docs.map(d => ({ id: d.id, ...d.data(), practiceId: candidate.practiceId })));
  }

  // 3) Same email + name
  if (c.email && c.firstName && c.lastName) {
    const q3 = query(
      scoped,
      where("email", "==", c.email),
      where("firstNameLower", "==", c.firstName),
      where("lastNameLower", "==", c.lastName),
      limit(10)
    );
    results.push(...(await getDocs(q3)).docs.map(d => ({ id: d.id, ...d.data(), practiceId: candidate.practiceId })));
  }

  // unique by doc id
  const seen = new Set<string>();
  return results.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)));
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
    firstName: toTitleCase(data.firstName),
    lastName: toTitleCase(data.lastName),
    firstNameLower: (data.firstName || "").trim().toLowerCase(),
    lastNameLower: (data.lastName || "").trim().toLowerCase(),
    dob: (data.dob || "").trim(),
    phone: cleanPhone(data.phone),
    email: (data.email || "").trim().toLowerCase(),
    createdAt: serverTimestamp(),
  };
  await addDoc(patientsCollection(data.practiceId), toSave as any);
}

export async function getPatient(practiceId: string, id: string) {
  const snap = await getDoc(doc(db, "practices", practiceId, "patients", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Patient;
}

export async function updatePatient(practiceId: string, id: string, data: Partial<Patient>) {
  if (!practiceId || !id) throw new Error("Missing practice or patient ID.");
  const patch: any = { ...data };
  if (patch.firstName != null) {
    patch.firstName = toTitleCase(patch.firstName);
    patch.firstNameLower = String(patch.firstName).trim().toLowerCase();
  }
  if (patch.lastName != null) {
    patch.lastName = toTitleCase(patch.lastName);
    patch.lastNameLower = String(patch.lastName).trim().toLowerCase();
  }
  if (patch.email != null) patch.email = String(patch.email).trim().toLowerCase();
  if (patch.phone != null) patch.phone = cleanPhone(patch.phone);
  await updateDoc(doc(db, "practices", practiceId, "patients", id), patch);
}
