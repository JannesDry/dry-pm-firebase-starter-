'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { usePractice } from '@/components/practice-context';
import { Card, Button } from '@/components/ui';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { practices, setSelectedId, loading: practiceLoading } = usePractice();

  // If not signed in, send straight to Sign-in
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace('/signin');
  }, [authLoading, user, router]);

  // While we figure out auth/practices, show a tiny loader
  if (authLoading || !user || practiceLoading) {
    return <p>Loading…</p>;
  }

  // Signed-in view: show practice cards right away
  return (
    <div className="space-y-4">
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
                setSelectedId(p.id);
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
