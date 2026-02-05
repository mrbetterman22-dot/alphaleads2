"use client";

import { useState } from "react";
import { useData } from "@/context/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Globe,
  Mail,
  User,
  Unlock,
  Lock,
  AlertTriangle,
  Sparkles,
  AlertOctagon,
  Zap,
} from "lucide-react";

export function LeadFeed() {
  const { leads, unlockLead, userCredits } = useData();
  const [activeTab, setActiveTab] = useState<"fresh" | "pain">("fresh");

  // 1. FILTER LOGIC (The "Bucket" System)
  const filteredLeads = leads.filter((lead) => {
    // TAB 1: FRESH OPPORTUNITIES (Growth & Tech)
    if (activeTab === "fresh") {
      // A. Website Solutions (No website found)
      const needsWebsite = !lead.website;

      // B. AI Solutions (Has website, but no email/contact found -> Needs Chatbot)
      const needsAI = lead.website && !lead.email;

      // C. Facebook Pixel (Has website, but Pixel is missing)
      // Note: this relies on the scraper successfully checking for pixels
      const needsPixel = lead.website && lead.website_has_fb_pixel === false;

      // D. Ghost/Unclaimed
      const ghostOrUnclaimed =
        lead.bucket_category === "Unclaimed Business" ||
        lead.bucket_category === "Ghost Profile";

      return needsWebsite || needsAI || needsPixel || ghostOrUnclaimed;
    }

    // TAB 2: PAIN POINTS (Reputation & Recovery)
    if (activeTab === "pain") {
      // A. Low Volume (< 50 reviews)
      const lowVolume = (lead.review_count || 0) < 50;

      // B. Bad Rating (< 4.5 stars)
      const badRating = (lead.rating || 0) < 4.5;

      // C. Toxic Reviews (Has 1-star reviews)
      const hasHate = (lead.reviews_per_score_1 || 0) > 0;

      return lowVolume || badRating || hasHate;
    }

    return true;
  });

  // 2. SORTING (Unlocked leads always on top)
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (a.is_unlocked && !b.is_unlocked) return -1;
    if (!a.is_unlocked && b.is_unlocked) return 1;
    return 0;
  });

  // 3. EMPTY STATE
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <p className="text-zinc-500">
          No leads found yet. Add a monitor above to start.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TABS NAVIGATION */}
      <div className="flex gap-2 p-1 bg-zinc-900/50 w-fit rounded-lg border border-zinc-800">
        <button
          onClick={() => setActiveTab("fresh")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "fresh"
              ? "bg-[#ffe600] text-black shadow-lg shadow-[#ffe600]/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          <Sparkles size={16} />
          Fresh Opportunities
        </button>
        <button
          onClick={() => setActiveTab("pain")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "pain"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          <AlertOctagon size={16} />
          Pain Points
        </button>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedLeads.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 italic border border-zinc-800/50 rounded-xl">
            No leads match this category.
          </div>
        ) : (
          sortedLeads.map((lead) => (
            <Card
              key={lead.id}
              className={`border-zinc-800 bg-[#0b0a0b] overflow-hidden transition-all hover:border-zinc-700 ${
                lead.is_unlocked
                  ? "border-[#ffe600]/40 shadow-[0_0_15px_rgba(255,230,0,0.1)]"
                  : ""
              }`}
            >
              {/* CARD HEADER */}
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className="uppercase text-[10px] tracking-wider border bg-zinc-800 text-zinc-400 border-zinc-700"
                  >
                    {activeTab === "fresh" ? "Growth" : "Recovery"}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <span
                      className={`font-bold ${lead.rating && lead.rating < 4.5 ? "text-red-500" : "text-white"}`}
                    >
                      {lead.rating} ★
                    </span>
                    <span>({lead.review_count})</span>
                  </div>
                </div>
                {lead.is_unlocked ? (
                  <Unlock size={16} className="text-[#ffe600]" />
                ) : (
                  <Lock size={16} className="text-zinc-600" />
                )}
              </CardHeader>

              {/* CARD CONTENT */}
              <CardContent className="pb-2 space-y-3">
                <div>
                  <h3
                    className="text-lg font-bold text-white truncate"
                    title={lead.business_name}
                  >
                    {lead.business_name}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate">{lead.city}</p>
                </div>

                {/* DYNAMIC PITCH HOOK (Based on why they are in this tab) */}
                <div className="bg-zinc-900/50 p-2 rounded text-xs text-zinc-300 border border-zinc-800 flex gap-2 items-start">
                  {activeTab === "pain" ? (
                    <AlertTriangle
                      size={14}
                      className="text-red-400 mt-0.5 shrink-0"
                    />
                  ) : (
                    <Zap size={14} className="text-[#ffe600] mt-0.5 shrink-0" />
                  )}
                  <span>
                    {/* FRESH TAB LOGIC */}
                    {activeTab === "fresh" &&
                      !lead.website &&
                      "Pitch: Web Design Package"}
                    {activeTab === "fresh" &&
                      lead.website &&
                      !lead.email &&
                      "Pitch: AI Chatbot (Missed Leads)"}
                    {activeTab === "fresh" &&
                      lead.website &&
                      lead.website_has_fb_pixel === false &&
                      "Pitch: Facebook Ads Setup"}
                    {activeTab === "fresh" &&
                      lead.bucket_category === "Unclaimed Business" &&
                      "Pitch: GMB Verification"}

                    {/* PAIN TAB LOGIC */}
                    {activeTab === "pain" &&
                      (lead.reviews_per_score_1 || 0) > 0 &&
                      `Urgent: Remove ${lead.reviews_per_score_1} Bad Reviews`}
                    {activeTab === "pain" &&
                      (lead.review_count || 0) < 50 &&
                      "Pitch: Reputation Building Campaign"}

                    {/* FALLBACK */}
                    {!lead.bucket_details && "General Opportunity"}
                  </span>
                </div>

                {/* DATA DETAILS (Blurred if locked) */}
                <div
                  className={`space-y-2 text-sm ${!lead.is_unlocked ? "blur-sm select-none opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-2 text-zinc-400">
                    <User size={14} />
                    <span
                      className={
                        lead.full_name ? "text-white" : "text-zinc-600 italic"
                      }
                    >
                      {lead.full_name || "Owner Name"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail size={14} />
                    <span
                      className={
                        lead.email ? "text-white" : "text-zinc-600 italic"
                      }
                    >
                      {lead.email || "Email Hidden"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Globe size={14} />
                    <span
                      className={
                        lead.website
                          ? "text-blue-400 underline"
                          : "text-zinc-600 italic"
                      }
                    >
                      {lead.website ? "Website Link" : "No Website"}
                    </span>
                  </div>
                </div>
              </CardContent>

              {/* CARD FOOTER */}
              <CardFooter className="pt-2">
                {lead.is_unlocked ? (
                  <Button
                    className="w-full bg-zinc-800 text-white hover:bg-zinc-700"
                    variant="outline"
                  >
                    View Details
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-[#ffe600] text-black hover:bg-[#ffe600]/90 font-bold"
                    onClick={() => unlockLead(lead.id)}
                    disabled={userCredits < 1}
                  >
                    {userCredits > 0 ? "Unlock (1 Credit)" : "No Credits"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
