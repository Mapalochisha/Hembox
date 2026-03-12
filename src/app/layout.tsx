import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/CartProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "HemBox", template: "%s | HemBox" },
  description: "Premium clothing — crafted for everyday living.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}