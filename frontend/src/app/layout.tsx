import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Comzera Cards | Dynamic NFC Business Cards & CRM",
  description: "Create and manage premium dynamic NFC business cards for your company. Cross-promote subsidiary brands and capture prospect leads in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased text-gray-100 bg-zinc-950`}>
        {children}
      </body>
    </html>
  );
}
