"use client";

import { useState } from "react";
import { useData } from "@/context/data-provider";
import { LeadCard } from "@/components/dashboard/lead-card";
import { Coins, FileSpreadsheet, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeadsPage() {
  const { leads, unlockLead } = useData();
  const [activeTab, setActiveTab] = useState<"fresh" | "pain">("fresh");

  // Hardcoded credits for now (we will connect to DB later)
  const credits = 15;

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
    // Logic to unlock all visible leads
    alert("Unlock All Feature coming soon!");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center">
          <h2 className="text-3xl font-bold text-white">Leads</h2>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            variant={activeTab === "fresh" ? "secondary" : "outline"}
            onClick={() => setActiveTab("fresh")}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            Fresh Opportunities
          </Button>
          <Button
             variant={activeTab === "pain" ? "destructive" : "outline"}
            onClick={() => setActiveTab("pain")}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            Pain Hunter
          </Button>

          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <FileSpreadsheet size={16} className="mr-2 text-green-500" />
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
          <div className="col-span-full text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
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
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-zinc-800 text-zinc-500"
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
