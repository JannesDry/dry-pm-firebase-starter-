import './globals.css';
import AuthProvider from '@/components/auth-provider';
import PracticeProvider from '@/components/practice-context';

export const metadata = {
  title: 'Dry PM',
  description: 'Optometry Practice Management Software',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PracticeProvider>
            {children}
          </PracticeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
