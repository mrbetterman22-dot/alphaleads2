"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import {
  AlertTriangle,
  Star,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LeadCardProps {
  lead: Lead;
  onUnlock: (leadId: string) => void;
  canUnlock: boolean;
}

export function LeadCard({ lead, onUnlock, canUnlock }: LeadCardProps) {
  const { toast } = useToast();
  // Safe access to ai_pitch (fallback to null if missing)
  const [pitch, setPitch] = useState<string | null>(lead.ai_pitch || null);
  const [loadingPitch, setLoadingPitch] = useState(false);

  // SAFEGUARD 1: Handle different naming conventions (tag vs type)
  // Some versions of your code used 'opportunity_tag', others 'opportunity_type'
  const type =
    (lead as any).opportunity_type ||
    (lead as any).opportunity_tag ||
    "New Business";
  const rating = lead.rating || 0; // Default to 0 if missing

  const isPainPoint = type === "Bad Review" || rating < 4;

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  const generatePitch = async () => {
    if (pitch) return;
    setLoadingPitch(true);
    // Simulation
    setTimeout(() => {
      setPitch(
        `I saw your review about "${lead.review_text?.substring(0, 20) || "service"}..." and noticed you might be missing calls. Our AI agent can answer 100% of these instantly.`,
      );
      setLoadingPitch(false);
    }, 1500);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-[#ffe600]/50 transition-all shadow-sm group relative overflow-hidden">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-white group-hover:text-[#ffe600] transition-colors">
              {lead.business_name || "Unknown Business"}
            </h3>
            {/*
            {isPainPoint ? (
              <Badge
                variant="destructive"
                className="bg-red-950/50 text-red-500 border-red-900 gap-1"
              >
                <AlertTriangle size={12} />
                Pain Point
              </Badge>
            ) : (
              <Badge className="bg-[#ffe600]/10 text-[#ffe600] border-[#ffe600]/20 gap-1 hover:bg-[#ffe600]/20">
                <Sparkles size={12} />
                Fresh Opportunities
              </Badge>
            )}
            {!lead.is_unlocked && (
              <Badge
                variant="outline"
                className="text-zinc-500 border-zinc-700 gap-1"
              >
                <Lock size={10} />
                Locked
              </Badge>
            )}
            */}
          </div>
          <div className="flex items-center text-zinc-500 text-sm gap-4">
            <span className="flex items-center gap-1">
              <Star
                size={14}
                className={isPainPoint ? "text-red-500" : "text-yellow-500"}
                fill="currentColor"
              />
              {/* SAFEGUARD 2: The fix for your error */}
              {rating > 0 ? rating.toFixed(1) : "N/A"}
            </span>

          </div>
        </div>
      </div>

      {/* The Review Text (The "Pain") */}
      {isPainPoint && lead.review_text && (
        <div className="mb-4 bg-red-950/10 border border-red-900/20 rounded-lg p-3">
          <p className="text-zinc-300 text-sm italic">"{lead.review_text}"</p>
        </div>
      )}

      {/* AI Sales Pitch Section 
      {isPainPoint && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-[#ffe600]/10 flex items-center justify-center">
              <Sparkles size={12} className="text-[#ffe600]" />
            </div>
            <span className="text-xs font-semibold text-[#ffe600] uppercase tracking-wider">
              AI Generated Pitch
            </span>
          </div>

          <div className="bg-black/50 rounded-lg p-3 border border-zinc-800 min-h-[60px] relative">
            {!pitch && !loadingPitch ? (
              <button
                onClick={generatePitch}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Click to generate pitch based on review
              </button>
            ) : loadingPitch ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Analyzing sentiment...
              </div>
            ) : (
              <p className="text-zinc-300 text-sm leading-relaxed">{pitch}</p>
            )}
          </div>
        </div>
      )}
      */}

      {/* Contact Info Section */}
      <div className="relative mt-4 pt-4 border-t border-zinc-800">
        <div
          className={`grid grid-cols-2 gap-4 ${!lead.is_unlocked ? "blur-sm select-none opacity-50" : ""}`}
        >
          <div
            onClick={() => lead.is_unlocked && handleCopy(lead.email || "")}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white cursor-pointer transition-colors"
          >
            <Mail size={14} />
            <span className="text-zinc-300 truncate">
              {lead.email || "email@hidden.com"}
            </span>
          </div>
          <div
            onClick={() => lead.is_unlocked && handleCopy(lead.phone || "")}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white cursor-pointer transition-colors"
          >
            <Phone size={14} />
            <span className="text-zinc-300 truncate">
              {lead.phone || "+1 (555) ***-****"}
            </span>
          </div>
        </div>

        {/* Unlock Button Overlay */}
        {!lead.is_unlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Button
              onClick={() => onUnlock(lead.id)}
              disabled={!canUnlock}
              className={`
                font-bold rounded-full shadow-xl transition-all
                ${
                  canUnlock
                    ? "bg-[#ffe600] text-black hover:bg-[#ffe600]/80 hover:scale-105"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                }
              `}
            >
              {canUnlock ? (
                <Unlock size={14} className="mr-2" />
              ) : (
                <Lock size={14} className="mr-2" />
              )}
              {canUnlock ? "Unlock Data (1 Credit)" : "No Credits"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
