"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Upload,
  PieChart,
  ShieldCheck,
  Zap,
  FileText,
  BarChart3,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "min-h-screen transition-colors flex flex-col",
        // MODIFICATION: Added a subtle gradient to the background for a better 'glass' effect
      )}
    >
      {/* LIQUID GLASS HEADER (NAVIGATION)
         - sticky top-6: Floats 24px from the top
         - rounded-full: Capsule shape
         - backdrop-blur-md: The "frosted glass" blur
         - bg-white/40: Semi-transparent background
         - border-white/20: Subtle, glass-like border
         - shadow-lg: Sense of depth (floating)
      */}
      <header
        className={cn(
          "sticky top-6 z-50 mx-auto flex w-[90%] max-w-5xl items-center justify-between px-6 py-3",
          "rounded-3xl border shadow-sm",
          isDark
            ? "bg-neutral-950 border-white/30 shadow-black/20"
            : "bg-slate-50 border-slate-200",
        )}
      >
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span>Penolet Finance</span>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/#how-it-works"
            className={cn(
              "text-sm font-medium transition-colors hover:text-[#ffe600]", // Yellow text on hover
              isDark ? "text-slate-200" : "text-slate-800", // Base text color
            )}
          >
            Learn more
          </Link>

          <Button
            asChild
            variant="ghost" // Re-add ghost variant
            size="sm"
            className={cn(
              "font-medium transition-colors hover:text-[#ffe600]", // Remove rounded-full and hover:bg
              isDark ? "text-slate-200" : "text-slate-800", // Base text color
            )}
          >
            <Link href="/login">Log in</Link>
          </Button>

          <div className="h-4 w-[1px] bg-border/50 mx-1"></div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 hover:bg-transparent hover:text-[#ffe600]"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </header>

      <main className="flex-1 mx-auto flex w-full max-w-5xl flex-col items-center justify-start px-4 py-10 text-center">
        {/* HERO SECTION (HEADLINE) */}
        <div className="mx-auto max-w-2xl space-y-8 mb-20 mt-16">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Turn raw bank statements into{" "}
            <span className="text-[#ffe600]">clear financial insights.</span>
          </h1>

          <p
            className={cn(
              "text-lg max-w-lg mx-auto",
              isDark ? "text-white" : "text-slate-600",
            )}
          >
            Stop guessing where your money goes. Upload your statements and get
            instant analytics.
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                // WRITE YOUR OWN CODE HERE in the bg-[#...] part:
                className="!bg-[#fee100] !text-black px-8 text-base h-12 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Link href="/login">Try it for Free</Link>
              </Button>
              <a
                href="#how-it-works"
                className={cn(
                  "text-sm font-medium underline-offset-4 hover:underline",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                Learn more
              </a>
            </div>
            <p
              className={cn(
                "text-xs italic",
                isDark ? "text-white" : "text-slate-400",
              )}
            >
              *no credit card required
            </p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how-it-works" className="w-full max-w-4xl mb-24 scroll-mt-32">
          <h2 className="text-3xl font-bold mb-12">How it works?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Step 1 */}
            <div
              className={cn(
                "relative p-8 rounded-3xl border flex flex-col items-center text-center hover:scale-105 transition-transform duration-300",
                isDark
                  ? "bg-neutral-950 border-[#333]"
                  : "bg-slate-50 border-slate-200 shadow-sm",
              )}
            >
              <div className="absolute -top-4 bg-[#ffe600] text-black font-bold py-1 px-4 rounded-full text-sm shadow-md">
                STEP 1
              </div>

              <div className="mb-6 p-4 rounded-full bg-[#ffe600] text-black shadow-lg">
                <FileText size={40} />
              </div>

              <h3 className="text-xl font-bold mb-2">Upload your document</h3>
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-white" : "text-slate-600",
                )}
              >
                Drag and drop your bank statement (PDF or CSV). The system will
                start processing it immediately.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={cn(
                "relative p-8 rounded-3xl border flex flex-col items-center text-center hover:scale-105 transition-transform duration-300",
                isDark
                  ? "bg-neutral-950 border-[#333]"
                  : "bg-slate-50 border-slate-200 shadow-sm",
              )}
            >
              <div className="absolute -top-4 bg-[#ffe600] text-black font-bold py-1 px-4 rounded-full text-sm shadow-md">
                STEP 2
              </div>

              <div className="mb-6 p-4 rounded-full bg-[#ffe600] text-black shadow-lg">
                <BarChart3 size={40} />
              </div>

              <h3 className="text-xl font-bold mb-2">View your data</h3>
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-white" : "text-slate-600",
                )}
              >
                Done! Your transactions are categorized and displayed on clear
                charts.
              </p>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <h2 className="text-3xl font-bold mb-12">Features</h2>
        <div
          id="features"
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 text-left"
        >
          {/* Feature 1 */}
          <div
            className={cn(
              "p-6 rounded-2xl border hover:scale-105 transition-transform duration-300",
              isDark
                ? "bg-neutral-950 border-[#333]"
                : "bg-slate-50 border-slate-200 shadow-sm",
            )}
          >
            <div className="h-10 w-10 bg-[#ffe600] rounded-lg flex items-center justify-center mb-4 text-black shadow-md">
              <Upload size={20} />
            </div>
            <h3 className="text-xl font-bold mb-2">Easy Import</h3>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              Easily upload your PDF or CSV bank statements.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            className={cn(
              "p-6 rounded-2xl border hover:scale-105 transition-transform duration-300",
              isDark
                ? "bg-neutral-950 border-[#333]"
                : "bg-slate-50 border-slate-200 shadow-sm",
            )}
          >
            <div className="h-10 w-10 bg-[#ffe600] rounded-lg flex items-center justify-center mb-4 text-black shadow-md">
              <Zap size={20} />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Categorization</h3>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              AI automatically recognizes and categorizes your expenses.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className={cn(
              "p-6 rounded-2xl border hover:scale-105 transition-transform duration-300",
              isDark
                ? "bg-neutral-950 border-[#333]"
                : "bg-slate-50 border-slate-200 shadow-sm",
            )}
          >
            <div className="h-10 w-10 bg-[#ffe600] rounded-lg flex items-center justify-center mb-4 text-black shadow-md">
              <PieChart size={20} />
            </div>
            <h3 className="text-xl font-bold mb-2">Visual Analytics</h3>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              Visualize your finances with interactive charts.
            </p>
          </div>
        </div>

        {/* SECURITY */}
        <h2 className="text-3xl font-bold mb-12">
          Your data will always be safe
        </h2>
        <div
          className={cn(
            "w-full max-w-3xl p-8 rounded-3xl border flex flex-col md:flex-row items-center gap-6 mb-24 hover:scale-105 transition-transform duration-300",
            isDark
              ? "bg-neutral-950 border-[#333]"
              : "bg-slate-50 border-slate-200 shadow-sm",
          )}
        >
          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold mb-2">Bank-Grade Security</h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              Your data security is paramount. All uploaded files and
              transactions are encrypted. The system is protected by Google and
              Supabase industry standards.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        className={cn(
          "w-full py-8 px-4 border-t mt-auto",
          isDark
            ? "border-[#333] bg-neutral-950"
            : "border-slate-200 bg-slate-50",
        )}
      >
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-xl font-semibold">Penolet Finance</div>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-500",
              )}
            >
              © 2025 Penolet Finance. All rights reserved.
            </p>
          </div>

          <div
            className={cn(
              "flex gap-6 text-sm font-medium",
              isDark ? "text-white" : "text-slate-600",
            )}
          >
            <Link href="#" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="#" className="hover:underline">
              Contact
            </Link>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Twitter
                size={18}
                className={isDark ? "text-white" : "text-slate-600"}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Linkedin
                size={18}
                className={isDark ? "text-white" : "text-slate-600"}
              />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
