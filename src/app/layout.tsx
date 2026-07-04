import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AmbientBackground from "@/components/AmbientBackground";
import GlobalNotification from "@/components/GlobalNotification";
import { CartProvider } from "@/app/context/CartContext";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans_Arabic({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["arabic", "latin"],
  variable: "--font-ibm-plex",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

import { createClient } from "@/utils/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  let title = "CORE";
  let faviconUrl = "/favicon.ico";

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'system_settings').single();
    if (data?.value) {
      const v = data.value as any;
      title = v.tab_title || v.site_name || "CORE";
      faviconUrl = v.tab_favicon_url || v.logo_url || "/favicon.ico";
    }
  } catch (e) {
    // Fallback if DB is not ready during build
  }

  return {
    title,
    description: "منصة المبرمج المصري",
    icons: {
      icon: faviconUrl,
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`dark ${ibmPlex.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="bg-background text-on-surface custom-scrollbar min-h-screen">
        <CartProvider>
          <AmbientBackground />
          <NavBar />
          <GlobalNotification />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
