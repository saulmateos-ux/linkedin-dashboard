import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinkedIn Posts Dashboard",
  description: "Analytics dashboard for LinkedIn posts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="text-2xl font-bold text-gray-900">
                    LinkedIn Analytics
                  </Link>
                  <nav className="hidden md:flex space-x-6">
                    <Link
                      href="/"
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/posts"
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      All Posts
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="https://www.linkedin.com/in/saulmateos/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Profile →
                  </a>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-center text-sm text-gray-600">
                Built with Next.js, Tailwind CSS, and Neon PostgreSQL
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
