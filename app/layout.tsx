import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitmentAI | Know if it fits before you buy",
  description:
    "AI aftermarket car fitment assistant for wheels, tires, suspension, spacers, and other parts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
