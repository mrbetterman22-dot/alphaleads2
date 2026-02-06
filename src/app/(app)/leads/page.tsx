"use client";

import { useState } from "react";
import { useData } from "@/context/data-provider";
import { LeadCard } from "@/components/dashboard/lead-card";
import {
  FileSpreadsheet,
  Lock,
  Unlock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadsPage() {
  const { leads, unlockLead, userCredits } = useData();
  const [activeTab, setActiveTab] = useState<"fresh" | "pain">("fresh");

  const credits = userCredits;

  // --- FILTERING LOGIC ---
  const filteredLeads = leads.filter((l) => {
    if (activeTab === "fresh") {
      // Logic for Fresh Opportunities
      return (
        l.opportunity_tags?.includes("Website Pitch") ||
        l.opportunity_tags?.includes("Quick Flip")
      );
    } else {
      // PAIN HUNTER LOGIC:
      // 1. Less than 50 reviews
      // 2. Less than 4.6 stars
      // 3. At least one 1-star review
      const hasBadReview = (l.reviews_per_score_1 ?? 0) > 0;
      return l.review_count < 50 && l.rating < 4.6 && hasBadReview;
    }
  });

  const lockedLeadsCount = filteredLeads.filter((l) => !l.is_unlocked).length;

  const handleUnlock = async (id: string) => {
    if (credits > 0) {
      await unlockLead(id);
    }
  };

  const handleUnlockAll = async () => {
    alert("Unlock All Feature coming soon!");
  };

  // --- CSV DOWNLOAD LOGIC ---
  const downloadCSV = () => {
    const headers = [
      "business_name",
      "rating",
      "review_count",
      "email",
      "phone",
      "city",
    ];

    const toCSV = (data: any[]) =>
      data
        .map((lead) =>
          headers
            .map((header) => {
              let value = lead[header] ?? "";
              if (typeof value === "string") {
                value = `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(","),
        )
        .join("\n");

    const csvContent = [
      `# ${activeTab === "fresh" ? "Fresh Opportunities" : "Pain Points"}`,
      headers.join(","),
      toCSV(filteredLeads.filter((l) => l.is_unlocked)),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `alphaleads_${activeTab}.csv`);
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
      <div className="grid grid-cols-1 gap-4">
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
              No leads found for this specific criteria.
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
            Unlock All ({lockedLeadsCount} Credits)
          </Button>
        </div>
      )}
    </div>
  );
}
