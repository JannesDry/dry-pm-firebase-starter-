import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to Dry PM (Firebase)</h1>
      <p className="text-gray-600">Web-based practice manager prototype with Firebase Auth + Firestore.</p>
      <div className="flex gap-3">
        <Link className="underline" href="/signin">Sign in</Link>
        <Link className="underline" href="/dashboard">Dashboard</Link>
      </div>
    </div>
  );
}
