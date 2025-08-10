'use client';
import { useAuth } from "./auth-provider";
import Link from "next/link";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">You need to sign in</h1>
        <p className="text-gray-600">Only staff can access this page.</p>
        <Link className="underline" href="/signin">Go to Sign in</Link>
      </div>
    );
  }
  return <>{children}</>;
}
