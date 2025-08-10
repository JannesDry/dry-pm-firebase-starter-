'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

type Practice = { id: string; name: string };
type Ctx = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  practices: Practice[];
  allowedIds: string[];
  loading: boolean;
};

const PracticeCtx = createContext<Ctx>({
  selectedId: null, setSelectedId: () => {},
  practices: [], allowedIds: [], loading: true
});

export function usePractice() { return useContext(PracticeCtx); }

export default function PracticeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [allowedIds, setAllowedIds] = useState<string[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  // restore saved practice choice
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('practiceId') : null;
    if (saved) setSelectedId(saved);
  }, []);

  // persist selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedId) localStorage.setItem('practiceId', selectedId);
  }, [selectedId]);

  // load allowed practice IDs for this user
  useEffect(() => {
    async function run() {
      if (authLoading) return;
      if (!user) { setAllowedIds([]); setPractices([]); setLoading(false); return; }
      const uref = doc(db, 'users', user.uid);
      const snap = await getDoc(uref);
      const ids: string[] = (snap.exists() && Array.isArray(snap.data().allowedPractices)) ? snap.data().allowedPractices : [];
      setAllowedIds(ids);

      // load all practices and filter to allowed ones (N=3, so client filter is fine)
      const ps = await getDocs(collection(db, 'practices'));
      const list: Practice[] = [];
      ps.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      setPractices(list.filter(p => ids.includes(p.id)));
      setLoading(false);

      // auto-select if only one
      if (!selectedId && ids.length === 1) setSelectedId(ids[0]);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return (
    <PracticeCtx.Provider value={{ selectedId, setSelectedId, practices, allowedIds, loading }}>
      {children}
    </PracticeCtx.Provider>
  );
}
