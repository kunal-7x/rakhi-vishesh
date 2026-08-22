import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { TemplateGallery } from "@/components/landing/TemplateGallery";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { BRAND } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#2a0e04] font-sans text-[#fff6e9]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#2a0e04]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold">
            <span className="bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] bg-clip-text text-transparent">
              {BRAND}
            </span>{" "}
            🪔
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#ffd9a0]/80 sm:flex">
            <Link href="#templates" className="transition-colors hover:text-[#ffd97a]">
              Themes
            </Link>
            <Link href="#how-it-works" className="transition-colors hover:text-[#ffd97a]">
              How it works
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-[#ffd97a]">
              Pricing
            </Link>
          </nav>
          <Link
            href="/create"
            className="rounded-full bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] px-5 py-2 text-sm font-semibold text-[#2a0e04] shadow-[0_4px_20px_rgba(255,157,46,0.35)] transition-all hover:brightness-110"
          >
            Create ✨
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        <TemplateGallery />
        <HowItWorks />
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}
