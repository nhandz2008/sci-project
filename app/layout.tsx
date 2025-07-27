import "../styles/globals.css";
import type { ReactNode } from "react";
import Navbar from "../components/navbar";

export const metadata = {
  title: "SCI - Science Competitions Insight",
  description: "Discover and participate in global science and technology competitions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
} 