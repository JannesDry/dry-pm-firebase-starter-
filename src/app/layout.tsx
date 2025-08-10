import "./globals.css";
import Link from "next/link";
import AuthProvider from "@/components/auth-provider";
import SignOutButton from "./signout-button";

export const metadata = {
  title: "Dry PM (Firebase)",
  description: "Practice Manager MVP for Dry Optometrist"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen">
            <nav className="border-b bg-white">
              <div className="container flex h-14 items-center gap-6">
                <Link href="/dashboard" className="font-semibold">Dry PM</Link>
                <div className="flex gap-4 text-sm">
                  <Link href="/patients">Patients</Link>
                </div>
                <div className="ml-auto">
                  <SignOutButton />
                </div>
              </div>
            </nav>
            <main className="container py-6">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
