"use client";

import { Target, Activity, Zap, Trash2, Plus, Search } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/data-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DashboardPage() {
  const { clearData } = useData();
  const { toast } = useToast();

  // Dummy data for the layout - We will connect these to Supabase in the next step
  const leadsFound = 128;
  const activeMonitors = 4;
  const availableCredits = 50;

  const handleClearData = () => {
    clearData();
    toast({
      title: "Database Reset",
      description: "All lead history and monitors have been cleared.",
    });
  };

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Background Gradients (The "Liquid Glass" Effect) */}
      <div className="pointer-events-none fixed inset-0 -z-10 h-full w-full bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-yellow-400/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#ffe600]/10 blur-[100px]" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Market Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor triggers and manage your strategic leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset System
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-white/20 backdrop-blur-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your active monitors and
                  leads.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearData}
                  className="rounded-full !bg-destructive"
                >
                  Clear Database
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button className="!bg-[#ffe600] !text-black rounded-full shadow-lg hover:shadow-[#ffe600]/20 transition-all font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Add Monitor
          </Button>
        </div>
      </div>

      {/* Stats Grid - Rewritten for Leads */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Leads Found"
          value={leadsFound.toString()}
          description="Ready for outreach"
          icon={Target}
        />
        <StatCard
          title="Active Monitors"
          value={activeMonitors.toString()}
          description="Scanning 24/7"
          icon={Activity}
        />
        <StatCard
          title="Available Credits"
          value={availableCredits.toString()}
          description="Unlock owner emails"
          icon={Zap}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 grid-cols-1">
        {/* We are repurposing the transactions table as the "Leads Feed" */}
        <div className="rounded-3xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-[#ffe600]" />
              <h2 className="text-xl font-semibold">Latest Trigger Alerts</h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
              >
                Fresh Blood
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
              >
                Pain Points
              </Button>
            </div>
          </div>
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}
