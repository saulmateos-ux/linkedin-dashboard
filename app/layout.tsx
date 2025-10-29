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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <ThemeProvider>
          <Suspense fallback={<div>Loading...</div>}>
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
