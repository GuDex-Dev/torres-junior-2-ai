import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Torres Jr. 2 Assistant",
  description: "Asistente virtual IA creado para la tienda de ropa Torres Jr. 2",
};

export default function RootLayout({
  children,
}: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${nunito.className}`}
      >
        {children}
      </body>
    </html>
  );
}
