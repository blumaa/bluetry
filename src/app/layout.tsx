import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import { Header } from '@/components/Header';
import { PoemSidebar } from '@/components/PoemSidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'bluetry - Poetry & Words',
  description: 'A beautiful place to share and discover poetry',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <UIProvider>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex h-[calc(100vh-3.5rem)]">
                  <PoemSidebar />
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </UIProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
