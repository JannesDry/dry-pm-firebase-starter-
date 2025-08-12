import {
  collection,
  collectionGroup,
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
  const c = norm(candidate);
  const results: any[] = [];

  if (!candidate.practiceId) return [];

  const scoped = patientsCollection(candidate.practiceId);

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

  // If none found, global fallback across ALL practices (collectionGroup)
  if (results.length === 0) {
    const cg = collectionGroup(db, "patients");
    if (c.firstName && c.lastName && c.dob) {
      const q1g = query(cg, where("firstName", "==", c.firstName), where("lastName", "==", c.lastName), where("dob", "==", c.dob), limit(10));
      results.push(...(await getDocs(q1g)).docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (c.phone) {
      const q2g = query(cg, where("phone", "==", c.phone), limit(10));
      results.push(...(await getDocs(q2g)).docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (c.email && c.firstName && c.lastName) {
      const q3g = query(cg, where("email", "==", c.email), where("firstName", "==", c.firstName), where("lastName", "==", c.lastName), limit(10));
      results.push(...(await getDocs(q3g)).docs.map(d => ({ id: d.id, ...d.data() })));
    }
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.id}-${r.firstName}-${r.lastName}-${r.dob}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function listPatients(practiceId: string) {
  if (practiceId === "__all__") {
    // No orderBy to avoid index requirements; client-side sort by lastName, firstName.
    const cg = collectionGroup(db, "patients");
    const snapAll = await getDocs(query(cg, limit(2000)));
    return snapAll.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => {
        const la = (a.lastName || "").localeCompare(b.lastName || "");
        if (la !== 0) return la;
        return (a.firstName || "").localeCompare(b.firstName || "");
      }) as Patient[];
  }

  const qScoped = query(patientsCollection(practiceId), orderBy("createdAt", "desc"), limit(500));
  const snap = await getDocs(qScoped);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), practiceId })) as Patient[];
}

export async function createPatient(data: Patient) {
  if (!data.practiceId) throw new Error("Missing practiceId");

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
