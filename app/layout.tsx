import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/lib/theme";
import { RoleProvider } from "@/contexts/RoleContext";
import { MultiAgentProvider } from "@/contexts/MultiAgentContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { SkipLinks } from "@/components/accessibility";
import { SessionProvider } from "@/components/auth";

// Material Symbols font URL
const materialSymbolsUrl = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheBridge - SRE Command Center",
  description: "AI-powered SRE command center for reliability, observability, and incident management",
  icons: {
    icon: "/thebridge-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="stylesheet" href={materialSymbolsUrl} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col overflow-hidden`}
      >
        <SessionProvider>
          <ThemeProvider defaultVariant="midnight-command" defaultMode="auto">
            <RoleProvider>
              <MultiAgentProvider>
                <DashboardProvider>
                  <SkipLinks />
                  <Header />
                  <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden" role="main">
                    {children}
                  </main>
                  <Footer />
                </DashboardProvider>
              </MultiAgentProvider>
            </RoleProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
