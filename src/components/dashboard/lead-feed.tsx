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
  ShieldAlert,
  Bot,
  EyeOff,
} from "lucide-react";

export function LeadFeed() {
  const { leads, unlockLead, userCredits } = useData();
  const [activeTab, setActiveTab] = useState<"fresh" | "pain">("fresh");

  // --- THE SNIPER LOGIC ---
  const getBucket = (lead: any) => {
    const oneStar = lead.reviews_per_score_1 || 0;
    const fiveStar = lead.reviews_per_score_5 || 0;
    const generator = (lead.website_generator || "").toLowerCase();
    const badTech =
      generator.includes("wix") ||
      generator.includes("joomla") ||
      generator.includes("squarespace");
    const rating = lead.rating || 0;
    const reviews = lead.review_count || 0;

    // --- 1. FRESH OPPORTUNITIES (Technical / Existence) ---

    // 🪣 Bucket D: Unclaimed (The "Quick Flip")
    if (lead.is_verified === false) {
      return {
        id: "D",
        tab: "fresh",
        label: "Claiming Pitch",
        color: "text-orange-400",
        icon: ShieldAlert,
        pitch: "Risk: Unclaimed Google Listing. Secure it for $99.",
      };
    }

    // 🪣 Bucket A: Website Issues (The "Tech Pitch")
    // Checks for No Website, Bad Tech, OR No Pixel
    if (
      !lead.website ||
      badTech ||
      (lead.website && lead.website_has_fb_pixel === false)
    ) {
      let reason = !lead.website
        ? "No Website"
        : badTech
          ? `Old Tech (${lead.website_generator})`
          : "No FB Pixel";
      return {
        id: "A",
        tab: "fresh",
        label: "Website Pitch",
        color: "text-blue-400",
        icon: Globe,
        pitch: `Pitch: Build a Next.js site. (${reason})`,
      };
    }

    // --- 2. PAIN POINTS (Reputation / Volume) ---

    // 🪣 Bucket B/Toxic: Toxic Reviews (Has 1-star reviews)
    if (oneStar > 0) {
      // Special Case: High Ticket AI Pitch (If they are a real biz with phone)
      if (fiveStar > 10 && lead.phone) {
        return {
          id: "B",
          tab: "fresh", // High Ticket Tech Sale
          label: "AI High Ticket",
          color: "text-purple-400",
          icon: Bot,
          pitch: `AI Pitch: Has ${oneStar} bad reviews & missed calls.`,
        };
      }
      // General Case: Toxic Review Removal
      return {
        id: "TOXIC",
        tab: "pain",
        label: "Toxic Reviews",
        color: "text-red-500",
        icon: AlertTriangle,
        pitch: `Critical: Has ${oneStar} 1-star reviews. Needs removal.`,
      };
    }

    // 🪣 Bucket C: Bad Rating (< 4.5 Stars)
    if (rating < 4.5) {
      return {
        id: "RATING",
        tab: "pain",
        label: "Reputation Repair",
        color: "text-red-400",
        icon: AlertOctagon,
        pitch: `Low Rating: ${rating} Stars. Needs automated campaign.`,
      };
    }

    // 🪣 Bucket "Safety Buffer": Low Volume (< 50 Reviews)
    // This catches EVERYONE else who is "Good" but "Small".
    if (reviews < 50) {
      return {
        id: "VOLUME",
        tab: "pain",
        label: "Low Authority",
        color: "text-yellow-400",
        icon: ShieldAlert,
        pitch: `Fragile: Only ${reviews} reviews. One bad review will hurt.`,
      };
    }

    // 🗑️ TRASH (Perfect Business: Verified, Website, >4.5 Stars, >50 Reviews, No 1-Stars)
    return null;
  };

  // --- FILTERING ---
  const filteredLeads = leads.filter((lead) => {
    const bucket = getBucket(lead);
    if (!bucket) return false;
    return bucket.tab === activeTab;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (a.is_unlocked && !b.is_unlocked) return -1;
    if (!a.is_unlocked && b.is_unlocked) return 1;
    return 0;
  });

  const totalHidden = leads.filter((l) => getBucket(l) === null).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-zinc-900/50 w-fit rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveTab("fresh")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "fresh"
                ? "bg-[#ffe600] text-black shadow-lg shadow-[#ffe600]/20"
                : "text-zinc-400 hover:text-white"
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
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <AlertOctagon size={16} />
            Pain Points
          </button>
        </div>

        {/* HIDDEN COUNTER (Peace of Mind) */}
        {totalHidden > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <EyeOff size={14} />
            <span>Hiding {totalHidden} "Perfect" Businesses</span>
          </div>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedLeads.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 italic border border-zinc-800/50 rounded-xl">
            No leads match this category.
          </div>
        ) : (
          sortedLeads.map((lead) => {
            const bucket = getBucket(lead)!;
            const BucketIcon = bucket.icon;

            return (
              <Card
                key={lead.id}
                className={`border-zinc-800 bg-[#0b0a0b] overflow-hidden transition-all hover:border-zinc-700 ${lead.is_unlocked ? "border-[#ffe600]/40 shadow-[0_0_15px_rgba(255,230,0,0.1)]" : ""}`}
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className={`uppercase text-[10px] tracking-wider border bg-zinc-800 text-zinc-400 border-zinc-700`}
                    >
                      {bucket.label}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <span
                        className={`font-bold ${lead.rating < 4.5 ? "text-red-500" : "text-white"}`}
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

                <CardContent className="pb-2 space-y-3">
                  <div>
                    <h3
                      className="text-lg font-bold text-white truncate"
                      title={lead.business_name}
                    >
                      {lead.business_name}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">
                      {lead.city}
                    </p>
                  </div>

                  {/* PITCH SECTION: Explicitly listing the issue */}
                  <div className="bg-zinc-900/50 p-2 rounded text-xs text-zinc-300 border border-zinc-800 flex gap-2 items-start">
                    <BucketIcon
                      size={14}
                      className={`${bucket.color} mt-0.5 shrink-0`}
                    />
                    <span>{bucket.pitch}</span>
                  </div>

                  {/* CONTACT DETAILS */}
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
                        {lead.website || "No Website"}
                      </span>
                    </div>
                  </div>
                </CardContent>

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
            );
          })
        )}
      </div>
    </div>
  );
}
