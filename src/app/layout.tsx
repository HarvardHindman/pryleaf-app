import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { StreamChatProvider } from "@/contexts/StreamChatContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CommunityCacheProvider } from "@/contexts/CommunityCacheContext";
import { TickerCacheProvider } from "@/contexts/TickerCacheContext";
import AppShell from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <CommunityCacheProvider>
              <TickerCacheProvider>
                <StreamChatProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                </StreamChatProvider>
              </TickerCacheProvider>
            </CommunityCacheProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
