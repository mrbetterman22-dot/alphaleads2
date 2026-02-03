"use client";

import { useState, useEffect } from "react";
import { Target, Zap, Mail, Lock, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";

export default function LeadFeedPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // 1. Fetch Leads from Supabase
  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch leads.",
      });
    } else {
      setLeads(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // 2. Trigger the Scraper API
  const handleScrape = async () => {
    setIsScraping(true);
    toast({
      title: "Scanner Started",
      description: "Fetching new leads from Outscraper...",
    });

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({
          query: "Dentists",
          location: "London",
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Leads have been added to your feed.",
        });
        fetchLeads();
      } else {
        throw new Error("Scrape failed");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Scrape Failed",
        description: "Check your API key and connection.",
      });
    } finally {
      setIsScraping(false);
    }
  };

  // NEW: 3. Handle Unlock Logic
  const handleUnlock = async (leadId: string) => {
    try {
      const response = await fetch("/api/leads/unlock", {
        method: "POST",
        body: JSON.stringify({ leadId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Lead Unlocked",
          description: "1 credit has been deducted from your balance.",
        });
        fetchLeads(); // Refresh table to show the now-visible email
      } else {
        toast({
          variant: "destructive",
          title: "Unlock Failed",
          description: data.error || "Something went wrong.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to communicate with the server.",
      });
    }
  };

  // 4. Filter Leads by Tab
  const filteredLeads = leads.filter((lead) => {
    if (activeTab === "all") return true;
    return lead.trigger_type === activeTab;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Lead Feed</h1>
            <Badge
              variant="secondary"
              className="rounded-full bg-[#ffe600]/10 text-[#ffe600] border-[#ffe600]/20 flex gap-1 items-center py-1"
            >
              <Search className="h-3 w-3" />
              Active Monitor: Dentists in London
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Real-time opportunities identified in your target area.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="px-4 py-2 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-md border-slate-200 dark:border-white/10"
          >
            <Zap className="h-4 w-4 mr-2 text-[#ffe600] fill-[#ffe600]" />
            <span className="font-bold">50 Credits</span>
          </Badge>
          <Button
            onClick={handleScrape}
            disabled={isScraping}
            className="!bg-[#ffe600] !text-black rounded-full font-bold shadow-lg disabled:opacity-50"
          >
            {isScraping ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isScraping ? "Scraping..." : "Change Location"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-full p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <TabsTrigger value="all" className="rounded-full">
            All Leads
          </TabsTrigger>
          <TabsTrigger value="fresh-blood" className="rounded-full">
            Fresh Blood
          </TabsTrigger>
          <TabsTrigger value="pain-point" className="rounded-full">
            Pain Points
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#ffe600]" />
                <p className="text-sm text-muted-foreground">
                  Loading your leads...
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                  <TableRow>
                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">
                      Business
                    </TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">
                      Trigger
                    </TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-slate-100">
                      Contact
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-900 dark:text-slate-100">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell>
                        <div className="font-bold text-base">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-0.5 ${lead.trigger_type === "pain-point" ? "border-red-200 text-red-600 bg-red-50/50" : "border-green-200 text-green-600 bg-green-50/50"}`}
                        >
                          {lead.trigger_type === "pain-point"
                            ? "Low Rating"
                            : "New Lead"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.is_unlocked ? (
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="h-3 w-3 text-[#ffe600]" />{" "}
                            {lead.email || "No email found"}
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleUnlock(lead.id)}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 gap-2 rounded-full border border-dashed border-slate-300 dark:border-white/20 hover:border-[#ffe600]/50"
                          >
                            <Lock className="h-3 w-3" /> Unlock Email (1 Cr)
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="rounded-full !bg-[#ffe600] !text-black font-bold px-5"
                        >
                          Get Script
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
