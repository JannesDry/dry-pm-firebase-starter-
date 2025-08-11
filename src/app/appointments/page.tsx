'use client';

import RequireAuth from '@/components/require-auth';

export default function AppointmentsPage() {
  const url = process.env.NEXT_PUBLIC_SETMORE_URL;

  if (!url) {
    return (
      <RequireAuth>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Appointments</h1>
          <p className="text-sm text-gray-600">
            Setmore URL is not configured. Add <code>NEXT_PUBLIC_SETMORE_URL</code> to your .env and Vercel
            Environment Variables (e.g. https://booking.setmore.com/s/your-page-id), then redeploy.
          </p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <div className="rounded-xl border overflow-hidden">
          <iframe
            src={url}
            title="Setmore Appointments"
            className="w-full"
            style={{ height: '80vh' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </RequireAuth>
  );
}
