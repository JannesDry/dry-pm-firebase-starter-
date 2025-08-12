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
  practiceId: string;
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

  // 1) exact name+surname+dob
  if (c.firstName && c.lastName && c.dob) {
    const q1 = query(patientsCol,
      where("firstName", "==", c.firstName),
      where("lastName", "==", c.lastName),
      where("dob", "==", c.dob),
      where("practiceId", "==", candidate.practiceId),
      limit(10)
    );
    results.push(...(await getDocs(q1)).docs.map(d => ({ id: d.id, ...d.data() })));
  }

  // 2) same phone
  if (c.phone) {
    const q2 = query(patientsCol,
      where("phone", "==", c.phone),
      where("practiceId", "==", candidate.practiceId),
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
      where("practiceId", "==", candidate.practiceId),
      limit(10)
    );
    results.push(...(await getDocs(q3)).docs.map(d => ({ id: d.id, ...d.data() })));
  }

  // de-dup array by id
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export async function listPatients(practiceId: string) {
  const qx = query(
    patientsCol,
    where("practiceId", "==", practiceId),
    orderBy("createdAt", "desc"),
    limit(500)
  );
  const snap = await getDocs(qx);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Patient[];
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
    firstName: data.firstName.trim().toLowerCase(),
    lastName: data.lastName.trim().toLowerCase(),
    dob: (data.dob || "").trim(),
    phone: cleanPhone(data.phone),
    email: (data.email || "").trim().toLowerCase(),
    createdAt: serverTimestamp()
  };

  await addDoc(patientsCol, toSave as any);
}
