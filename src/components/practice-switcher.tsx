'use client';
import { useRouter } from 'next/navigation';
import { usePractice } from './practice-context';

export default function PracticeSwitcher() {
  const router = useRouter();
  const { selectedId, practices, setSelectedId } = usePractice();
  const current = practices.find(p => p.id === selectedId);

  function handleSwitch() {
    // Clear the current working practice so the selector shows
    setSelectedId(null);
    try {
      localStorage.removeItem('practiceId');
    } catch {
      // ignore storage errors (e.g., private mode)
    }
    // Send the user to the selector (your / page shows practice cards after login)
    router.push('/');
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">
        {current ? `Working in: ${current.name}` : 'No practice selected'}
      </span>
      <button
        onClick={handleSwitch}
        className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
        title="Switch working practice"
      >
        Switch practice
      </button>
    </div>
  );
}
