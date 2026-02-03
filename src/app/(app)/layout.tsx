import { Logo } from '@/components/logo';
import { MainNav } from '@/components/main-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { DataProvider } from '@/context/data-provider';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DataProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="sidebar">
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            <UserNav user={user} />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:hidden">
            <SidebarTrigger />
            <Logo />
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}