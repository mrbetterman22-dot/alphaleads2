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
  const [pitch, setPitch] = useState<string | null>(lead.ai_pitch || null);
  const [loadingPitch, setLoadingPitch] = useState(false);

  // SAFEGUARD: Handle different naming conventions
  const type =
    (lead as any).opportunity_type ||
    (lead as any).opportunity_tag ||
    "New Business";
  const rating = lead.rating || 0;

  const isPainPoint = type === "Bad Review" || rating < 4;

  // Select the icon for the floating background effect
  const BackgroundIcon = isPainPoint ? AlertTriangle : Sparkles;

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  const generatePitch = async () => {
    if (pitch) return;
    setLoadingPitch(true);
    setTimeout(() => {
      setPitch(
        `I saw your review about "${lead.review_text?.substring(0, 20) || "service"}..." and noticed you might be missing calls. Our AI agent can answer 100% of these instantly.`,
      );
      setLoadingPitch(false);
    }, 1500);
  };

  return (
    // FIX: Applied Dashboard "Glowing Glass" styles
    <div className="group relative overflow-hidden bg-[#0b0a0b] border border-zinc-800 rounded-xl p-5 transition-all duration-300 hover:border-[#ffe600]/30 hover:shadow-[0_0_30px_rgba(255,230,0,0.05)]">
      {/* Floating Background Icon Effect */}
      <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 pointer-events-none">
        <BackgroundIcon size={120} />
      </div>

      {/* Content Wrapper (z-10 ensures it sits above the icon) */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-white group-hover:text-[#ffe600] transition-colors">
                {lead.business_name || "Unknown Business"}
              </h3>
            </div>
            <div className="flex items-center text-zinc-500 text-sm gap-4">
              <span className="flex items-center gap-1">
                <Star
                  size={14}
                  className={isPainPoint ? "text-red-500" : "text-yellow-500"}
                  fill="currentColor"
                />
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
                      ? "!bg-[#ffe600] text-black shadow-lg shadow-[#ffe600]/20 hover:!bg-[#ffe600]/90 hover:scale-105"
                      : "!bg-[#ffe600]/30 text-black border border-[#ffe600]/20 hover:!bg-[#ffe600]/50" // Dimmer yellow when disabled with hover
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
    </div>
  );
}
