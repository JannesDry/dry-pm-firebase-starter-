import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dry PM',
  description: 'In-house Practice Management Software',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            {/* Logo / Brand */}
            <div className="flex gap-6 items-center">
              <Link href="/" className="text-lg font-semibold">
                Dry PM
              </Link>

              {/* Navigation */}
              <nav className="flex gap-4 text-sm">
                <Link href="/patients">Patients</Link>
                <Link href="/appointments">Appointments</Link>
                <Link href="/files">Files</Link>
                <Link href="/settings">Settings</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
