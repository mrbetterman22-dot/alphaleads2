import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
// FIX: Ensure this is a Named Import with curly braces
import { DataProvider } from "@/context/data-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      {/* FIX: Force Sidebar Provider to match the black background */}
      <SidebarProvider
        style={{ backgroundColor: "rgba(0, 0, 0, 1)" }}
        className="w-full min-h-screen"
      >
        <AppSidebar />

        {/* Main Content Area - Also Pure Black */}
        <main
          className="flex-1 overflow-y-auto h-screen text-white"
          style={{ backgroundColor: "rgba(0, 0, 0, 1)" }}
        >
          <div className="p-4 md:p-6">
            <div className="md:hidden mb-4">
              <SidebarTrigger className="text-white" />
            </div>
            {children}
          </div>
        </main>
      </SidebarProvider>
    </DataProvider>
  );
}
