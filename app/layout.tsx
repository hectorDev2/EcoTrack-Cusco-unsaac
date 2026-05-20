import type { Metadata } from "next";
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
  title: "Eco Track Cusco - UNSAAC",
  description:
    "Sistema inteligente de recolección de residuos para Cusco, con monitoreo en tiempo real y participación ciudadana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunitoSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-on-background font-sans">
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <Providers>
          <DevNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
