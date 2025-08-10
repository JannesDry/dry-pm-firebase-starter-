'use client';
import Link from 'next/link';
import { usePractice } from './practice-context';

export default function PracticeSwitcher() {
  const { selectedId, practices } = usePractice();
  const current = practices.find(p => p.id === selectedId);
  return (
    <Link href="/practice" className="text-sm underline">
      {current ? `Practice: ${current.name}` : 'Select practice'}
    </Link>
  );
}
