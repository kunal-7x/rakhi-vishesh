import type { Metadata } from "next";
import { Rajdhani, Jost, Dancing_Script } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "RakhiVishesh — Animated Rakhi Cards",
  description:
    "Create a beautiful animated Rakhi card with photos, names and your message. Share it with a link or download it as a video.",
  openGraph: {
    title: "RakhiVishesh — Animated Rakhi Cards",
    description:
      "Create a beautiful animated Rakhi card with photos, names and your message. Share it with a link or download it as a video.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${jost.variable} ${dancing.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#1a0803] text-[#fff6e9]">{children}</body>
    </html>
  );
}
