'use client';
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button, Card, Input, Label } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">Staff Sign in</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Sign in</Button>
        </form>
        <p className="mt-3 text-xs text-gray-500">Admins can invite staff via Firebase Console → Authentication.</p>
      </Card>
    </div>
  );
}
