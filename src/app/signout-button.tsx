'use client';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui";
import { usePractice } from "@/components/practice-context";

export default function SignOutButton() {
  const { setSelectedId } = usePractice();

  function handleSignOut() {
    // Clear selection so next login always asks
    setSelectedId(null);
    try { localStorage.removeItem('practiceId'); } catch {}
    signOut(auth);
  }

  return <Button onClick={handleSignOut}>Sign out</Button>;
}
