"use client";

import { useState } from "react";
import { useData } from "@/context/data-provider";
import { LeadCard } from "@/components/dashboard/lead-card";
import {
  Coins,
  FileSpreadsheet,
  Lock,
  Unlock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadsPage() {
  // FIX: Destructure userCredits from context
  const { leads, unlockLead, userCredits } = useData();
  const [activeTab, setActiveTab] = useState<"fresh" | "pain">("fresh");

  // FIX: Use real credits instead of hardcoded 15
  const credits = userCredits;

  // Filter leads based on tab
  const filteredLeads = leads.filter((l) =>
    activeTab === "fresh"
      ? l.opportunity_type === "New Business"
      : l.opportunity_type === "Bad Review" || l.rating < 4,
  );

  const lockedLeadsCount = filteredLeads.filter((l) => !l.is_unlocked).length;

  const handleUnlock = async (id: string) => {
    if (credits > 0) {
      await unlockLead(id);
    }
  };

  const handleUnlockAll = async () => {
    alert("Unlock All Feature coming soon!");
  };

  const downloadCSV = () => {
    const headers = [
      "business_name",
      "opportunity_type",
      "rating",
      "review_text",
      "email",
      "phone",
      "is_unlocked",
    ];

    const freshLeads = leads.filter(
      (l) => l.opportunity_type === "New Business" && l.is_unlocked
    );
    const painLeads = leads.filter(
      (l) => (l.opportunity_type === "Bad Review" || l.rating < 4) && l.is_unlocked
    );

    const toCSV = (data: Lead[]) => // Changed type from typeof leads to Lead[]
      data
        .map((lead) =>
          headers
            .map((header) => {
              let value = lead[header as keyof typeof lead] ?? "";
              if (typeof value === "string") {
                value = `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        )
        .join("\n");

    const csvContent = [
      "# Fresh Opportunities",
      headers.join(","),
      toCSV(freshLeads),
      "\n# Pain Points",
      headers.join(","),
      toCSV(painLeads),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center">
          <h2 className="text-3xl font-bold text-white">Leads</h2>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* FRESH OPPORTUNITIES BUTTON */}
          <Button
            onClick={() => setActiveTab("fresh")}
            className={`
              relative h-10 px-6 rounded-full font-bold transition-all duration-300 border
              ${
                activeTab === "fresh"
                  ? "bg-green-500/10 text-green-400 border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                  : "bg-[#0b0a0b] text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
              }
            `}
          >
            <Sparkles size={16} className="mr-2" />
            Fresh Opportunities
          </Button>

          {/* PAIN HUNTER BUTTON */}
          <Button
            onClick={() => setActiveTab("pain")}
            className={`
              relative h-10 px-6 rounded-full font-bold transition-all duration-300 border
              ${
                activeTab === "pain"
                  ? "bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  : "bg-[#0b0a0b] text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
              }
            `}
          >
            <AlertTriangle size={16} className="mr-2" />
            Pain Hunter
          </Button>

          {/* CSV Export Button */}
          <Button
            variant="outline"
            className="h-10 px-4 rounded-full border-zinc-800 bg-[#0b0a0b] text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700"
            onClick={downloadCSV}
          >
            <FileSpreadsheet size={16} className="mr-2 text-zinc-500" />
            CSV
          </Button>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {filteredLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onUnlock={handleUnlock}
            canUnlock={credits > 0}
          />
        ))}

        {filteredLeads.length === 0 && (
          <div className="col-span-full text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-[#0b0a0b]">
            <p className="text-zinc-500">
              No leads found for this category yet.
            </p>
            <p className="text-sm text-zinc-600 mt-2">
              Try adding a new Monitor in the Dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Unlock All Footer */}
      {lockedLeadsCount > 0 && (
        <div className="flex justify-center mt-8 pt-6 border-t border-zinc-900">
          <Button
            onClick={handleUnlockAll}
            disabled={credits < lockedLeadsCount}
            className={`
                  h-12 px-8 rounded-full font-bold text-base shadow-xl transition-all
                  ${
                    credits >= lockedLeadsCount
                      ? "!bg-[#ffe600] text-black hover:!bg-[#ffe600]/90"
                      : "!bg-[#ffe600]/30 text-black border border-[#ffe600]/20 hover:!bg-[#ffe600]/50"
                  }
              `}
          >
            {credits >= lockedLeadsCount ? (
              <Unlock size={18} className="mr-2" />
            ) : (
              <Lock size={18} className="mr-2" />
            )}
            Unlock All{" "}
            {activeTab === "fresh" ? "Fresh Opportunities" : "Pain Points"} (
            {lockedLeadsCount} Credits)
          </Button>
        </div>
      )}
    </div>
  );
}
