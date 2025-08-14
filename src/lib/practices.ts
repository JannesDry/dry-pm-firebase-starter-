import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Practice = { id: string; name: string };

export async function listPractices(): Promise<Practice[]> {
  const snap = await getDocs(collection(db, "practices"));
  const rows = snap.docs.map(d => {
    const data = d.data() as any;
    return { id: d.id, name: data?.name || d.id } as Practice;
  });
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}
