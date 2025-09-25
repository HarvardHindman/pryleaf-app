import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { StreamChatProvider } from "@/contexts/StreamChatContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pryleaf - Professional Financial Analysis Platform",
  description: "Advanced stock ticker analysis and market intelligence platform for professional investors and traders.",
  keywords: "stocks, finance, investment, trading, market analysis, ticker search",
  authors: [{ name: "Pryleaf" }],
  icons: {
    icon: '/pryleaf.PNG',
    shortcut: '/pryleaf.PNG',
    apple: '/pryleaf.PNG',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <StreamChatProvider>
              <AppShell>
                {children}
              </AppShell>
            </StreamChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
