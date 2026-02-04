"use client";

import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Coins,
  ChevronUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  // Placeholder credits - in a real app, this would come from your DataProvider
  const credits = 15;

  return (
    <Sidebar className="border-r border-zinc-800 bg-black">
      <SidebarHeader className="p-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-[#ffe600] rounded-md flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-full" />
          </div>
          AlphaLeads
        </h1>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Credit Widget */}
        <div className="px-2 mb-6 mt-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Available Credits
              </span>
              <Coins size={14} className="text-[#ffe600]" />
            </div>
            <div className="text-2xl font-bold text-white">{credits}</div>

          </div>
        </div>

        {/* Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  className="hover:bg-zinc-800 text-zinc-400 data-[active=true]:bg-[#ffe600] data-[active=true]:text-black font-medium transition-all"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/leads"}
                  className="hover:bg-zinc-800 text-zinc-400 data-[active=true]:bg-[#ffe600] data-[active=true]:text-black font-medium transition-all"
                >
                  <Link href="/leads">
                    <Users />
                    <span>Leads</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg transition-colors border border-transparent hover:bg-zinc-900 hover:border-zinc-800 group">
              <div className="w-8 h-8 rounded-full bg-[#ffe600] flex items-center justify-center text-xs font-bold text-black">
                CS
              </div>
              <div className="text-sm text-left flex-1">
                <p className="text-white font-medium leading-none group-hover:text-[#ffe600] transition-colors">
                  Csiki
                </p>
                <p className="text-zinc-500 text-xs mt-1 truncate w-24">
                  csiki@example.com
                </p>
              </div>
              <ChevronUp size={14} className="text-zinc-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width] bg-zinc-950 border-zinc-800 text-white"
          >
            <DropdownMenuItem
              asChild
              className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer"
            >
              <Link href="/settings" className="flex items-center gap-2">
                <Settings size={14} />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 hover:bg-red-950/20 focus:bg-red-950/20 focus:text-red-400 cursor-pointer">
              <LogOut size={14} className="mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
