'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './auth-provider';

type Practice = { id: string; name: string };

type PracticeContextType = {
  practices: Practice[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  loading: boolean;
};

const PracticeContext = createContext<PracticeContextType>({
  practices: [],
  selectedId: null,
  setSelectedId: () => {},
  loading: true,
});

function PracticeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // Signed-out — clear everything
      if (!user) {
        if (!cancelled) {
          setPractices([]);
          setSelectedId(null);
          setLoading(false);
        }
        return;
      }

      try {
        // 1) Read allowed practice IDs from /users/{uid}
        const uref = doc(db, 'users', user.uid);
        const usnap = await getDoc(uref);
        const allowedIds: string[] =
          usnap.exists() && Array.isArray(usnap.data()?.allowedPractices)
            ? (usnap.data()!.allowedPractices as string[])
            : [];

        // 2) Fetch ONLY those practice docs explicitly
        const list: Practice[] = [];
        for (const id of allowedIds) {
          const psnap = await getDoc(doc(db, 'practices', id));
          if (psnap.exists()) {
            const data = psnap.data() as any;
            list.push({ id: psnap.id, name: data.name ?? psnap.id });
          }
        }

        if (cancelled) return;

        setPractices(list);

        // 3) Restore saved selection only if still allowed
        const saved =
          typeof window !== 'undefined' ? localStorage.getItem('practiceId') : null;
        if (saved && list.some(p => p.id === saved)) {
          setSelectedId(saved);
        } else {
          setSelectedId(null);
        }
      } catch (e) {
        console.error('Failed to load practices:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Persist selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (selectedId) localStorage.setItem('practiceId', selectedId);
    } catch {}
  }, [selectedId]);

  return (
    <PracticeContext.Provider value={{ practices, selectedId, setSelectedId, loading }}>
      {children}
    </PracticeContext.Provider>
  );
}

export default PracticeProvider;

export function usePractice() {
  return useContext(PracticeContext);
}
