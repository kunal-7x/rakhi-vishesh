import Link from "next/link";
import { BRAND } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#160702] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="text-lg font-bold text-[#fff6e9]">
            <span className="bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] bg-clip-text text-transparent">
              {BRAND}
            </span>{" "}
            🪔
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[#ffd9a0]/70">
            <Link href="/" className="transition-colors hover:text-[#ffd97a]">
              Home
            </Link>
            <Link href="/create" className="transition-colors hover:text-[#ffd97a]">
              Create a card
            </Link>
            <Link href="/admin" className="transition-colors hover:text-[#ffd97a]">
              Admin
            </Link>
          </nav>
          <p className="text-xs text-[#ffd9a0]/50">
            © {new Date().getFullYear()} {BRAND} · Made with 💝 for every bhai &amp; behen
          </p>
        </div>
      </div>
    </footer>
  );
}
