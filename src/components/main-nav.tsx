"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Sun, Moon, Coins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          tooltip="Toggle Theme"
          className="text-zinc-400 hover:text-[#ffe600] transition-colors"
        >
          {theme === "light" ? <Moon /> : <Sun />}
          <span className="sr-only">Toggle Theme</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem className="mt-auto pt-4 px-2">
      <div className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-black p-1">
        <button
          onClick={() => setTheme("light")}
          className={`flex-1 flex items-center justify-center rounded-md py-1.5 text-xs font-medium transition-all ${
            theme === "light"
              ? "bg-[#ffe600] text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sun className="mr-1 h-3 w-3" />
          Light
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`flex-1 flex items-center justify-center rounded-md py-1.5 text-xs font-medium transition-all ${
            theme === "dark"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Moon className="mr-1 h-3 w-3" />
          Dark
        </button>
      </div>
    </SidebarMenuItem>
  );
}

export function MainNav() {
  const pathname = usePathname();
  // In a real app, you would fetch this from useData()
  const credits = 15;

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/leads",
      label: "Leads",
      icon: Users,
    },
  ];

  return (
    <SidebarMenu className="px-2 space-y-6">
      {/* 1. Credit Widget (New Addition) */}
      <SidebarMenuItem>
        <div className="mx-1 mt-2 mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Available Credits
            </span>
            <Coins size={14} className="text-[#ffe600]" />
          </div>
          <div className="text-2xl font-bold text-white">{credits}</div>

        </div>
      </SidebarMenuItem>

      {/* 2. Navigation Links */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                tooltip={item.label}
                className={`
                  w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#ffe600] text-black shadow-[0_0_15px_rgba(255,230,0,0.15)] hover:bg-[#ffe600]/90"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }
                `}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon
                    className={`h-4 w-4 ${isActive ? "text-black" : "text-current"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </div>

      {/* 3. Theme Toggle at Bottom */}
      <ThemeToggle />
    </SidebarMenu>
  );
}
