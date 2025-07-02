import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wall",
  description: "Wall app demo by Luis Cabantac",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ fontFamily: "Tahoma, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
