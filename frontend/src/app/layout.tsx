import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SmartCampus",
    template: "%s | SmartCampus",
  },
  description: "Frontend shell for SmartCampus workflows and Google-authenticated access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-app text-slate-950">{children}</body>
    </html>
  );
}
