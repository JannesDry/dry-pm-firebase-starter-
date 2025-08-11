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

export function PracticeProvider({ children }: { children: React.ReactNode }) {
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
        // Get allowed practices from user document
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        let allowedPracticeIds: string[] = [];
        if (userSnap.exists()) {
          allowedPracticeIds = userSnap.data()?.allowedPractices || [];
        }

        // Get all practices
        const colRef = collection(db, 'practices');
        const snap = await getDocs(colRef);

        const allPractices: Practice[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as { name: string }),
        }));

        // Filter to allowed
        const filtered = allPractices.filter(p =>
          allowedPracticeIds.includes(p.id)
        );

        setPractices(filtered);

        // Load saved selection if still allowed
        const saved = localStorage.getItem('practiceId');
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
    <PracticeContext.Provider
      value={{ practices, selectedId, setSelectedId, loading }}
    >
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  return useContext(PracticeContext);
}
