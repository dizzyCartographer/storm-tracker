import type { Metadata } from "next";
import "./globals.css";
import { DisclaimerFooter } from "./_components/disclaimer-footer";

export const metadata: Metadata = {
  title: "Storm Tracker",
  description: "Parental Bipolar Prodrome Tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        <div className="flex-1">{children}</div>
        <DisclaimerFooter />
      </body>
    </html>
  );
}
