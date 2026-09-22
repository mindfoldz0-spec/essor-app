import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import { LanguageProvider } from "@/lib/languageContext";
import BottomNav from "@/components/BottomNav";
import OnboardingGuard from "@/components/OnboardingGuard";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Essor — Red White Black",
  description: "Voice-first rural entrepreneur platform for Maharashtra. Seller + Buyer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#EFEFEF] text-[var(--black)] flex justify-center">
        <StyledComponentsRegistry>
          <LanguageProvider>
            <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--white)] border-x-[2px] border-[var(--black)] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_24px_64px_rgba(0,0,0,0.16)] max-[430px]:border-x-0 max-[430px]:shadow-none">
              <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b-[2px] border-[var(--black)] bg-[var(--white)] px-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--red)] text-[var(--white)] font-black text-[14px]">E</span>
                  <span className="font-black tracking-tight text-[20px]">Essor</span>
                  <span className="ml-1 rounded-full bg-[var(--black)] px-2 py-0.5 text-[10px] font-black tracking-widest text-[var(--white)]">v0.0.1</span>
                </div>
              </header>
              <main className="flex-1 pb-[92px]">
                <OnboardingGuard>{children}</OnboardingGuard>
              </main>
              <BottomNav />
            </div>
          </LanguageProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
