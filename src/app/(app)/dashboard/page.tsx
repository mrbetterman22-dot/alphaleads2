"use client";

import { Radio, Plus, MoreHorizontal } from "lucide-react";
import { useData } from "@/context/data-provider";
import { AddMonitorDialog } from "@/components/dashboard/add-monitor-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { leads, monitors } = useData();

  // 1. Calculate Live Stats based on your Real Data
  const totalLeads = leads.length;
  const freshLeads = leads.filter(
    (l) => l.opportunity_type === "New Business",
  ).length;
  const painPoints = leads.filter(
    (l) => l.opportunity_type === "Bad Review" || l.rating < 4,
  ).length;

  const stats = [
    {
      label: "Total Leads Found",
      value: totalLeads,
      color: "text-white",
    },
    {
      label: "Fresh Opportunities",
      value: freshLeads,
      color: "text-[#ffe600]", // Your Primary Yellow
    },
    {
      label: "Pain Points Detected",
      value: painPoints,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* SECTION 1: DASHBOARD STATS */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-sm"
            >
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
                {stat.label}
              </p>
              <p className={`text-4xl font-bold mt-2 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: ACTIVE MONITORS TABLE */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio size={20} className="text-[#ffe600]" />
            Active Monitors
          </h2>

          {/* We wrap the Dialog in your custom button style */}
          <div className="bg-[#ffe600] rounded-full text-black font-bold shadow-lg shadow-[#ffe600]/20 transition-all hover:bg-[#ffe600]/90">
            <AddMonitorDialog />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-900/50 text-zinc-500 border-b border-zinc-800 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Keyword</th>
                <th className="px-6 py-4 font-medium">City</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Check</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                        className={`
                          uppercase text-[10px] tracking-wider border
                          ${
                            m.status === "active"
                              ? "bg-[#ffe600]/10 text-[#ffe600] border-[#ffe600]/20"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700"
                          }
                        `}
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {/* Placeholder for date - we can add this to DB later */}
                      {new Date().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-600 hover:text-white"
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
