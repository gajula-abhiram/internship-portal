import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";

export const metadata: Metadata = {
  title: "Internship Portal - Technical University",
  description: "Digital internship and placement management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ClientOnly
            fallback={
              <nav className="bg-blue-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center">
                      <span className="text-xl font-bold">
                        Internship Portal
                      </span>
                    </div>
                  </div>
                </div>
              </nav>
            }
          >
            <Navbar />
          </ClientOnly>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
