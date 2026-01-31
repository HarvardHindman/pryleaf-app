import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CommunityCacheProvider } from "@/contexts/CommunityCacheContext";
import { TickerCacheProvider } from "@/contexts/TickerCacheContext";
import AppShell from "@/components/AppShell";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Pryleaf - Your Community, Monetized",
  description: "Build a thriving creator community with premium content, exclusive insights, and powerful monetization tools. Connect with top creators and investors.",
  keywords: "creator platform, community, monetization, premium content, subscriptions, investment community, financial creators",
  authors: [{ name: "Pryleaf" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const themeMode = localStorage.getItem('themeMode') || 'system';
                  let actualTheme = 'light';
                  
                  if (themeMode === 'system') {
                    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  } else {
                    actualTheme = themeMode;
                  }
                  
                  document.documentElement.className = actualTheme;
                } catch (e) {
                  document.documentElement.className = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <ThemeProvider>
          <AuthProvider>
            <CommunityCacheProvider>
              <TickerCacheProvider>
                <AppShell>
                  {children}
                </AppShell>
              </TickerCacheProvider>
            </CommunityCacheProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
