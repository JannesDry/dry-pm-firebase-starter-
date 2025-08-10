'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { doc, getDoc } from 'firebase/firestore';

type Practice = { id: string; name: string };

type PracticeContext = {
  /** currently selected practice id (e.g., "p1") */
  selectedId: string | null;
  /** set the selected practice id (persists to localStorage) */
  setSelectedId: (id: string | null) => void;
  /** practices this user is allowed to access (name + id) */
  practices: Practice[];
  /** the raw list of allowed ids, e.g. ["p1","p2"] */
  allowedIds: string[];
  /** true while loading user/practice data */
  loading: boolean;
  /** last load error (if any) */
  error: string | null;
};

const PracticeCtx = createContext<PracticeContext>({
  selectedId: null,
  setSelectedId: () => {},
  practices: [],
  allowedIds: [],
  loading: true,
  error: null,
});

export function usePractice() {
  return useContext(PracticeCtx);
}

export default function PracticeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [allowedIds, setAllowedIds] = useState<string[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Restore saved practice choice (from previous session) ---
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('practiceId') : null;
      if (saved) setSelectedIdState(saved);
    } catch {
      // ignore localStorage errors (Safari private mode etc.)
    }
  }, []);

  // --- Persist selection to localStorage ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (selectedId) localStorage.setItem('practiceId', selectedId);
    } catch {
      // ignore persistence errors
    }
  }, [selectedId]);

  // --- Helper to set selected id and keep state consistent ---
  const setSelectedId = (id: string | null) => {
    setSelectedIdState(id);
  };

  // --- Load allowed practice IDs & fetch those practices explicitly ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // If auth still loading or user is signed out
      if (authLoading) return; // wait
      if (!user) {
        if (!cancelled) {
          setAllowedIds([]);
          setPractices([]);
          setLoading(false);
        }
        return;
      }

      try {
        // 1) Read allowed practice ids from /users/{uid}
        const uref = doc(db, 'users', user.uid);
        const usnap = await getDoc(uref);
        const ids: string[] =
          usnap.exists() && Array.isArray(usnap.data().allowedPractices)
            ? (usnap.data().allowedPractices as string[])
            : [];

        if (cancelled) return;

        setAllowedIds(ids);

        // 2) Fetch each allowed practice doc directly (avoids query-rule filtering surprises)
        const fetched: Practice[] = [];
        for (const id of ids) {
          const psnap = await getDoc(doc(db, 'practices', id));
          if (psnap.exists()) {
            const data = psnap.data() as any;
            fetched.push({ id: psnap.id, name: data.name ?? psnap.id });
          }
        }

        if (cancelled) return;

        setPractices(fetched);

        // 3) If user had a saved selection that's no longer allowed, clear it
        if (selectedId && !ids.includes(selectedId)) {
          setSelectedIdState(null);
        }

        // 4) If nothing selected and only one allowed, auto-select it
        if (!selectedId && ids.length === 1) {
          setSelectedIdState(ids[0]);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Failed to load practices');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]); // intentionally NOT depending on selectedId here

  // Memoize value to avoid unnecessary re-renders
  const value = useMemo<PracticeContext>(
    () => ({
      selectedId,
      setSelectedId,
      practices,
      allowedIds,
      loading,
      error,
    }),
    [selectedId, practices, allowedIds, loading, error]
  );

  return <PracticeCtx.Provider value={value}>{children}</PracticeCtx.Provider>;
}
