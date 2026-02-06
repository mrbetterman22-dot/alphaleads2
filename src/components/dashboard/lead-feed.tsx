"use client";

import { useData } from "@/context/data-provider";
import { classifyLead } from "@/lib/data";
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
  Phone,
  Unlock,
  Lock,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Lead } from "@/lib/types";

interface LeadFeedProps {
  leads: Lead[];
  hidePitch?: boolean;
}

export function LeadFeed({ leads, hidePitch = false }: LeadFeedProps) {
  const { unlockLead, userCredits } = useData();

  if (leads.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-zinc-500 italic border border-zinc-800/50 rounded-xl bg-[#0b0a0b]/30">
        No leads found in this view.
      </div>
    );
  }

  const sortedLeads = [...leads].sort((a, b) => {
    if (a.is_unlocked && !b.is_unlocked) return -1;
    if (!a.is_unlocked && b.is_unlocked) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedLeads.map((lead) => {
        const category = classifyLead(lead);

        let Icon = Zap;
        if (category.type === "fresh") Icon = Globe;
        if (category.type === "pain") Icon = AlertTriangle;

        return (
          <Card
            key={lead.id}
            className={`border-zinc-800 bg-[#0b0a0b] overflow-hidden transition-all hover:border-zinc-700 ${
              lead.is_unlocked
                ? "border-[#ffe600]/40 shadow-[0_0_15px_rgba(255,230,0,0.1)]"
                : ""
            }`}
          >
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className={`uppercase text-[10px] tracking-wider border bg-zinc-800 text-zinc-400 border-zinc-700`}
                >
                  {category.label}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <span
                    className={`font-bold ${
                      lead.rating < 4.5 ? "text-red-500" : "text-white"
                    }`}
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

            {/* CTO FIX: Increased padding-bottom to pb-6 */}
            <CardContent className="pb-6 space-y-3">
              <div>
                <h3
                  className="text-lg font-bold text-white truncate"
                  title={lead.business_name}
                >
                  {lead.business_name}
                </h3>
                <p className="text-xs text-zinc-400 truncate">{lead.city}</p>
              </div>

              {!hidePitch && (
                <div className="bg-zinc-900/50 p-2 rounded text-xs text-zinc-300 border border-zinc-800 flex gap-2 items-start">
                  <Icon
                    size={14}
                    className={`${category.color} mt-0.5 shrink-0`}
                  />
                  <span>{category.pitch}</span>
                </div>
              )}

              <div
                className={`space-y-2 text-sm ${
                  !lead.is_unlocked ? "blur-sm select-none opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone size={14} className="shrink-0" />
                  <span
                    className={`truncate ${lead.phone ? "text-white" : "text-zinc-600 italic"}`}
                  >
                    {lead.phone || "No Phone"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Mail size={14} className="shrink-0" />
                  <span
                    className={`truncate ${lead.email ? "text-white" : "text-zinc-600 italic"}`}
                  >
                    {lead.email || "Email Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Globe size={14} className="shrink-0" />
                  <span
                    className={`truncate ${lead.website ? "text-blue-400 underline" : "text-zinc-600 italic"}`}
                  >
                    {lead.website || "No Website"}
                  </span>
                </div>
              </div>
            </CardContent>

            {!lead.is_unlocked && (
              <CardFooter className="pt-2">
                <Button
                  className="w-full !bg-[#ffe600] !text-black hover:!bg-[#ffe600]/90 font-bold border-none"
                  onClick={() => unlockLead(lead.id)}
                  disabled={userCredits < 1}
                >
                  {userCredits > 0 ? "Unlock (1 Credit)" : "No Credits"}
                </Button>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}
