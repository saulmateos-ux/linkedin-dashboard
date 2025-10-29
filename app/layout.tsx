import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider as TailAdminThemeProvider } from '@/context/ThemeContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { Suspense } from 'react';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "LinkedIn Analytics Dashboard | TailAdmin",
  description: "Analytics dashboard for LinkedIn posts with TailAdmin UI",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <TailAdminThemeProvider>
          <Suspense fallback={<LoadingFallback />}>
            <WorkspaceProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </WorkspaceProvider>
          </Suspense>
        </TailAdminThemeProvider>
      </body>
    </html>
  );
}
