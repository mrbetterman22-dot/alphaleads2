import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { DataProvider } from "@/context/data-provider";

// We wrap the whole app in the DataProvider so Credits/Leads are available everywhere
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 bg-black text-white overflow-y-auto h-screen">
          <div className="p-4 md:p-6">
            {/* Mobile Trigger */}
            <div className="md:hidden mb-4">
              <SidebarTrigger />
            </div>
            {children}
          </div>
        </main>
      </SidebarProvider>
    </DataProvider>
  );
}
