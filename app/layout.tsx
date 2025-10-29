import type { Metadata } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import ThemeProvider from "@/components/ThemeProvider";
import VerticalLayout from "@/components/layout/VerticalLayout";

export const metadata: Metadata = {
  title: "LinkedIn Analytics Dashboard",
  description: "Analytics dashboard for LinkedIn posts with Material-UI",
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <ThemeProvider>
          <Suspense fallback={<LoadingFallback />}>
            <WorkspaceProvider>
              <VerticalLayout>
                {children}
              </VerticalLayout>
            </WorkspaceProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
