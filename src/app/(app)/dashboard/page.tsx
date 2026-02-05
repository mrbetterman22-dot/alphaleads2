"use client";

import { Radio, Target, Sparkles, AlertTriangle, Trash2 } from "lucide-react";
import { useData } from "@/context/data-provider";
import { AddMonitorDialog } from "@/components/dashboard/add-monitor-dialog";
import { ConsoleWindow } from "@/components/dashboard/console-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function DashboardPage() {
  const { leads, monitors, deleteMonitor } = useData();

  // --- STATS LOGIC UPDATE ---

  // 1. Calculate specific types first
  const freshLeads = leads.filter(
    (l) => l.opportunity_type === "New Business",
  ).length;
  const painPoints = leads.filter(
    (l) => l.opportunity_type === "Bad Review",
  ).length;

  // 2. Total is now strictly the sum of sellable opportunities
  // (We ignore 'High Performer' or other types)
  const totalLeads = freshLeads + painPoints;

  const stats = [
    {
      label: "Actionable Leads",
      value: totalLeads,
      color: "text-white",
      icon: Target,
    },
    {
      label: "New Business",
      value: freshLeads,
      color: "text-[#ffe600]",
      icon: Sparkles,
    },
    {
      label: "Pain Points",
      value: painPoints,
      color: "text-red-500",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-14 pb-20">
      {/* SECTION 1: STATS */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group relative overflow-hidden bg-[#0b0a0b] border border-zinc-800 p-6 rounded-2xl shadow-sm hover:border-[#ffe600]/30 transition-all"
            >
              <div className="relative z-10">
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                  <stat.icon size={16} className={stat.color} />
                  {stat.label}
                </p>
                <p className={`text-4xl font-bold mt-2 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: ACTIVE MONITORS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio size={20} className="text-[#ffe600]" />
            Active Monitors
          </h2>
          <div className="bg-[#ffe600] rounded-full text-black font-bold shadow-lg shadow-[#ffe600]/20 transition-all hover:bg-[#ffe600]/90">
            <AddMonitorDialog />
          </div>
        </div>

        <div className="bg-[#0b0a0b] border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-3">Keyword</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Checked</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {monitors.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No active monitors. Click "Add Monitor" to start tracking.
                  </td>
                </tr>
              ) : (
                monitors.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-zinc-900/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {m.keyword}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{m.location}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`uppercase text-[10px] tracking-wider border ${m.status === "active" ? "bg-[#ffe600]/10 text-[#ffe600] border-[#ffe600]/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this monitor?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will also delete all leads associated with
                              it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMonitor(m.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: LIVE CONSOLE */}
      <div className="space-y-4 pt-4">
        <ConsoleWindow />
      </div>
    </div>
  );
}
