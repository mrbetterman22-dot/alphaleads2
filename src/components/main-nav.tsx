'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (state === 'collapsed') {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          tooltip="Toggle Theme"
        >
          {theme === 'light' ? <Moon /> : <Sun />}
          <span className="sr-only">Toggle Theme</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem className="mb-2 flex justify-center px-3">
      <div className="flex w-full max-w-[85%] gap-2">
        <SidebarMenuButton
          onClick={() => setTheme('light')}
          size="lg"
          className={`flex-1 rounded-3xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${theme === 'light'
            ? 'border-[#fee100]/40 bg-[#fee100] text-slate-900 font-bold hover:bg-[#ffd700]'
            : 'border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 text-slate-800 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-black/70'
            }`}
        >
          <Sun className="h-5 w-5" />
          <span className="text-base font-medium">Light</span>
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={() => setTheme('dark')}
          size="lg"
          className={`flex-1 rounded-3xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${theme === 'dark'
            ? 'border-[#fee100]/40 bg-[#fee100] text-slate-900 font-bold hover:bg-[#ffd700] hover:text-slate-900'
            : 'border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 text-slate-800 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-black/70'
            }`}
        >
          <Moon className="h-5 w-5" />
          <span className="text-base font-medium">Dark</span>
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  );
}

export function MainNav() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/transactions',
      label: 'Transactions',
      icon: ArrowRightLeft,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <SidebarMenu className="px-3">
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href} className="mb-2 flex justify-center">
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href)}
            tooltip={item.label}
            size="lg"
            className="max-w-[85%] rounded-3xl border border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/70 dark:hover:bg-black/70 active:scale-[0.98] data-[active=true]:bg-white/80 dark:data-[active=true]:bg-black/80 data-[active=true]:font-bold text-slate-800 dark:text-slate-100"
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      <ThemeToggle />
    </SidebarMenu>
  );
}
