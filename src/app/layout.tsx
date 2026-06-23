import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardiff Live Social Needs Map — v0.2 prototype",
  description:
    "A clickable prototype of Module 1 of the Community Impact Accelerator, built around the Wales social mobility coalition's Phase 1 work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
