'use client';
import Link from 'next/link';
import { usePractice } from './practice-context';

export default function PracticeSwitcher() {
  const { selectedId, practices } = usePractice();
  const current = practices.find(p => p.id === selectedId);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">
        {current ? `Working in: ${current.name}` : 'No practice selected'}
      </span>
      <Link
        href="/practice"
        className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
        title="Switch working practice"
      >
        Switch practice
      </Link>
    </div>
  );
}
