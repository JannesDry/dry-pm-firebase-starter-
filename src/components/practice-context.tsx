'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
    let isCancelled = false;

    async function fetchPractices() {
      setLoading(true);

      // Signed out: clear state
      if (!user) {
        if (!isCancelled) {
          setPractices([]);
          setSelectedId(null);
          setLoading(false);
        }
        return;
      }

      try {
        // 1) Get allowed practice ids from /users/{uid}
        const uref = doc(db, 'users', user.uid);
        const usnap = await getDoc(uref);
        const allowedIds: string[] =
          usnap.exists() && Array.isArray(usnap.data()?.allowedPractices)
            ? (usnap.data()?.allowedPractices as string[])
            : [];

        // 2) Load all practices and filter to allowed
        const psnap = await getDocs(collection(db, 'practices'));
        const all = psnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Practice[];
        const allowed = all.filter(p => allowedIds.includes(p.id));

        if (isCancelled) return;

        setPractices(allowed);

        // 3) Restore saved selection ONLY if still allowed
        const saved = typeof window !== 'undefined' ? localStorage.getItem('practiceId') : null;
        if (saved && allowed.some(p => p.id === saved)) {
          setSelectedId(saved);
        } else {
          setSelectedId(null);
        }
      } catch (e) {
        console.error('Failed to load practices:', e);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchPractices();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Persist selection changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (selectedId) localStorage.setItem('practiceId', selectedId);
    } catch {
      /* ignore storage errors */
    }
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
