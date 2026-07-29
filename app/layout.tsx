import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { DevNav } from "./dev-nav";
import { Providers } from "./providers";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Eco Track Wanchaq - UNSAAC",
  description:
    "Sistema inteligente de recolección de residuos para Cusco, con monitoreo en tiempo real y participación ciudadana.",
  manifest: "/manifest.json",
  other: {
    "theme-color": "#154212",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Eco Track",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#154212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunitoSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-on-background font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=localStorage.getItem('theme');if(e==='dark'||(e!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(function(){})`,
          }}
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Providers>
          <DevNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
