import type { Metadata } from "next";
import { Libre_Baskerville, Karla } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const serif = Libre_Baskerville({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Karla({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Ma Bibliothèque",
  description: "Bibliothèque personnelle en ligne : souhaits, références par domaine, tendances, suivi des prix et disponibilité gratuite dans tous les formats.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${serif.variable} ${sans.variable}`}>
        <div style={{ minHeight: "100vh", background: "#e7dcc9", fontFamily: "var(--font-sans), system-ui, sans-serif", color: "#2a2018" }}>
          <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#3b2b20", color: "#f3ead9", boxShadow: "0 6px 24px rgba(30,18,10,.3)" }}>
            <div style={{ maxWidth: 1500, margin: "0 auto", padding: "16px 32px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 24, margin: 0, lineHeight: 1 }}>Ma Bibliothèque</h1>
              <Nav />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
