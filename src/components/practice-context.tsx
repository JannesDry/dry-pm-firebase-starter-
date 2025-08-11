'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './auth-provider';

type Practice = {
  id: string;
  name: string;
};

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
    async function fetchPractices() {
      if (!user) {
        setPractices([]);
        setSelectedId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1) Allowed practice IDs from /users/{uid}
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const allowedPracticeIds: string[] =
          userSnap.exists() && Array.isArray(userSnap.data()?.allowedPractices)
            ? userSnap.data().allowedPractices
            : [];

        // 2) Load all practices then filter to allowed
        const snap = await getDocs(collection(db, 'practices'));
        const all: Practice[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as { name: string }),
        }));
        const filtered = all.filter(p => allowedPracticeIds.includes(p.id));

        setPractices(filtered);

        // 3) Restore saved selection only if still allowed
        const saved = typeof window !== 'undefined' ? localStorage.getItem('practiceId') : null;
        if (saved && filtered.some(p => p.id === saved)) {
          setSelectedId(saved);
        } else {
          setSelectedId(null);
        }
      } catch (err) {
        console.error('Error fetching practices:', err);
      }

      setLoading(false);
    }

    fetchPractices();
  }, [user]);

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
