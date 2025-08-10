import "./globals.css";
import Link from "next/link";
import AuthProvider from "@/components/auth-provider";
import SignOutButton from "./signout-button";
import PracticeProvider from "@/components/practice-context";
import PracticeSwitcher from "@/components/practice-switcher";

export const metadata = {
  title: "Dry PM (Firebase)",
  description: "Practice Manager MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PracticeProvider>
            <div className="min-h-screen">
              <nav className="border-b bg-white">
                <div className="container flex h-14 items-center gap-6">
                  <Link href="/dashboard" className="font-semibold">Dry PM</Link>
                  <div className="flex gap-4 text-sm">
                    <Link href="/patients">Patients</Link>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <PracticeSwitcher />
                    <SignOutButton />
                  </div>
                </div>
              </nav>
              <main className="container py-6">{children}</main>
            </div>
          </PracticeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
