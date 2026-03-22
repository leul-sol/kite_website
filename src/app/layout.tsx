import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kite Business Owner Portal",
  description: "Manage your premium event rental business with Kite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
