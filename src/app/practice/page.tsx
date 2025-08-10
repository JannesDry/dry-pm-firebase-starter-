'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/require-auth';
import { usePractice } from '@/components/practice-context';
import { Card, Button } from '@/components/ui';

export default function PracticePage() {
  const router = useRouter();
  const { practices, selectedId, setSelectedId, loading } = usePractice();

  useEffect(() => {
    if (!loading && selectedId) router.push('/patients');
  }, [loading, selectedId, router]);

  if (loading) return <p>Loading…</p>;

  return (
    <RequireAuth>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Select a Practice</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {practices.map(p => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">ID: {p.id}</div>
              </div>
              <Button onClick={() => { setSelectedId(p.id); router.push('/patients'); }}>
                Use this
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
