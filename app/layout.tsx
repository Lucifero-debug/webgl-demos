import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Interactive 3D web work",
  description:
    "Three demonstration builds: a product configurator, a scroll-driven journey, and a clinic site.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, dark-mode
    // tools) inject attributes into <html> and <body> before React loads,
    // which React reports as a mismatch. It only silences attribute
    // differences on these two elements, never on anything inside them.
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <body
        className="font-[family-name:var(--font-archivo)]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
