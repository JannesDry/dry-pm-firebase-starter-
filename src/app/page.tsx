'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { usePractice } from '@/components/practice-context';
import { Card, Button } from '@/components/ui';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { practices, setSelectedId, selectedId, loading: practiceLoading } = usePractice();

  // If not signed in, go to /signin
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace('/signin');
  }, [authLoading, user, router]);

  // While auth/practice data is loading
  if (authLoading || !user || practiceLoading) {
    return <p>Loading…</p>;
  }

  return (
    <div className="space-y-5">
      {/* If a working practice exists, show it + allow quick clear */}
      {selectedId && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Current working practice:</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
            {practices.find(p => p.id === selectedId)?.name ?? selectedId}
          </span>
          <Button
            className="bg-gray-200 text-gray-900"
            onClick={() => {
              setSelectedId(null);
              try { localStorage.removeItem('practiceId'); } catch {}
            }}
            title="Clear selection to switch"
          >
            Clear selection
          </Button>
        </div>
      )}

      <h1 className="text-2xl font-semibold">Select a Practice</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {practices.map(p => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">ID: {p.id}</div>
            </div>
            <Button
              onClick={() => {
                // Set as working practice and go to Patients
                setSelectedId(p.id);
                try { localStorage.setItem('practiceId', p.id); } catch {}
                router.push('/patients');
              }}
            >
              Use this
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
