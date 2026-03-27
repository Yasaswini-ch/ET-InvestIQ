
import type { Metadata } from "next";
import { Instrument_Serif, Barlow, Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "ET InvestIQ",
  description: "AI-powered investment intelligence for Indian retail investors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${instrumentSerif.variable} ${barlow.variable}`}>
      <body className="bg-black text-white font-sans selection:bg-emerald-900 selection:text-emerald-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
