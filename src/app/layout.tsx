import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';

import AuthProvider from '@/components/auth-provider';
import PracticeProvider from '@/components/practice-context';
import PracticeSwitcher from '@/components/practice-switcher';
import SignOutButton from './signout-button';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dry PM',
  description: 'Optometry Practice Management Software',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PracticeProvider>
            <header className="border-b bg-white">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
                {/* Brand */}
                <Link href="/" className="text-lg font-semibold">
                  Dry PM
                </Link>

                {/* Nav */}
                <nav className="flex gap-4 text-sm">
                  <Link href="/patients">Patients</Link>
                  <Link href="/appointments">Appointments</Link>
                </nav>

                {/* Right side */}
                <div className="ml-auto flex items-center gap-4">
                  {/* Shows 'Working in: <Practice>' and a Switch button */}
                  <PracticeSwitcher />
                  <SignOutButton />
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
          </PracticeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
