'use client';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui";

export default function SignOutButton() {
  return <Button onClick={() => signOut(auth)}>Sign out</Button>;
}
