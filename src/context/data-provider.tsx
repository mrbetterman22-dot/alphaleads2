"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Lead, Monitor } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface DataContextType {
  leads: Lead[];
  monitors: Monitor[];
  userCredits: number;
  scansThisMonth: number;
  userEmail: string | undefined;
  addMonitor: (
    monitor: Partial<Monitor>,
  ) => Promise<{ success: boolean; error?: string }>;
  startScrape: (monitor: Monitor) => Promise<void>;
  unlockLead: (leadId: string) => Promise<void>;
  unlockAllLeads: (leadIds: string[]) => Promise<void>;
  clearData: () => Promise<void>;
  deleteMonitor: (monitorId: string) => Promise<void>;
  updateMonitor: (
    monitorId: string,
    updates: Partial<Monitor>,
  ) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [userCredits, setUserCredits] = useState(0);
  const [scansThisMonth, setScansThisMonth] = useState(0);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient();

  // --- CONFIGURATION ---
  const COST_PER_SCAN = 100;
  const COST_PER_UNLOCK = 1;

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email);

    // Get Credits & Scan Count (Source of Truth)
    const { data: userData } = await supabase
      .from("users")
      .select("credits, scans_this_month")
      .eq("id", user.id)
      .single();

    if (userData) {
      setUserCredits(userData.credits);
      setScansThisMonth(userData.scans_this_month || 0);
    }

    // Get Monitors
    const { data: monitorData } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (monitorData) setMonitors(monitorData);

    // Get Leads
    const { data: linkData } = await supabase
      .from("user_leads")
      .select("lead_id, is_unlocked")
      .eq("user_id", user.id);

    if (linkData && linkData.length > 0) {
      const leadIds = linkData.map((link) => link.lead_id);
      const { data: businessData } = await supabase
        .from("leads")
        .select("*")
        .in("id", leadIds);

      if (businessData) {
        const mergedLeads = businessData.map((biz) => {
          const link = linkData.find((l) => l.lead_id === biz.id);
          return { ...biz, is_unlocked: link?.is_unlocked || false };
        });
        setLeads(mergedLeads);
      }
    } else {
      setLeads([]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. ADD MONITOR ---
  const addMonitor = async (
    newMonitor: Partial<Monitor>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/extract/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMonitor),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      setMonitors((prev) => [data.monitor, ...prev]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // --- 3. START SCRAPE (Diagnostics Enabled) ---
  const startScrape = async (monitor: Monitor) => {
    // 1. Check Balance
    if (userCredits < COST_PER_SCAN) {
      toast({
        title: "Insufficient Funds",
        description: `Scan costs ${COST_PER_SCAN} credits. You have ${userCredits}.`,
        variant: "destructive",
      });
      return;
    }

    // 2. Check Monthly Limit
    if (scansThisMonth >= 10) {
      toast({
        title: "Monthly Limit Reached",
        description: `You have used all 10 scans for this month.`,
        variant: "destructive",
      });
      return;
    }

    // 3. Optimistic Updates
    setUserCredits((prev) => prev - COST_PER_SCAN);
    setScansThisMonth((prev) => prev + 1);
    setMonitors((prev) =>
      prev.map((m) => (m.id === monitor.id ? { ...m, status: "active" } : m)),
    );

    try {
      const startRes = await fetch("/api/extract/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: monitor.keyword,
          location: monitor.location,
        }),
      });

      const startData = await startRes.json();

      // If API rejected it, revert and sync
      if (!startRes.ok) {
        setUserCredits((prev) => prev + COST_PER_SCAN);
        setScansThisMonth((prev) => prev - 1);
        throw new Error(startData.error || "Failed to start");
      }

      const requestId = startData.requestId;

      // 4. Polling Loop
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;

        // Timeout (60 attempts * 5s = 5 minutes)
        if (attempts > 60) {
          clearInterval(pollInterval);

          // Force Sync (In case backend refunded silently)
          await fetchData();

          setMonitors((prev) =>
            prev.map((m) =>
              m.id === monitor.id ? { ...m, status: "paused" } : m,
            ),
          );
          toast({
            title: "Timeout",
            description: "Taking too long. Balance synced with server.",
            variant: "destructive",
          });
          return;
        }

        try {
          const checkRes = await fetch("/api/extract/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId }),
          });
          const checkData = await checkRes.json();

          if (checkData.status === "SUCCESS") {
            clearInterval(pollInterval);
            await fetchData(); // SYNC: Get new leads and true balance

            toast({
              title: "Scan Complete",
              description: `Scanned ${checkData.scanned} businesses. Found ${checkData.count} opportunities.`,
            });

            setMonitors((prev) =>
              prev.map((m) =>
                m.id === monitor.id ? { ...m, status: "paused" } : m,
              ),
            );
          } else if (checkData.status === "ZERO_RESULTS") {
            // --- DIAGNOSTIC REFUND LOGIC ---
            clearInterval(pollInterval);
            await fetchData(); // SYNC: Get refund from DB

            if (checkData.reason === "MARKET_SATURATED") {
              // CASE 1: Found businesses, but all were "Perfect"
              toast({
                title: "Market Too Perfect 🛡️",
                description: `Scanned ${checkData.scanned} businesses, but ALL were highly optimized (4.5+ stars, website, verified). 100 Credits Refunded.`,
                duration: 6000,
              });
            } else {
              // CASE 2: Found nothing (Typo or Empty Location)
              toast({
                title: "No Results Found 🔍",
                description:
                  "Outscraper found 0 businesses for this keyword. Check your spelling or location. 100 Credits Refunded.",
                variant: "destructive",
                duration: 6000,
              });
            }

            setMonitors((prev) =>
              prev.map((m) =>
                m.id === monitor.id ? { ...m, status: "paused" } : m,
              ),
            );
          }
        } catch (e) {
          console.error("Polling Error", e);
        }
      }, 5000);
    } catch (error: any) {
      console.error(error);
      // Revert optimistic update locally for speed
      setUserCredits((prev) => prev + COST_PER_SCAN);
      setScansThisMonth((prev) => prev - 1);

      // Force Sync to ensure we match DB
      await fetchData();

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setMonitors((prev) =>
        prev.map((m) => (m.id === monitor.id ? { ...m, status: "paused" } : m)),
      );
    }
  };

  // --- 4. UNLOCK SINGLE LEAD ---
  const unlockLead = async (leadId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (userCredits < COST_PER_UNLOCK) {
      toast({
        title: "Insufficient Credits",
        description: "Need 1 credit.",
        variant: "destructive",
      });
      return;
    }

    setUserCredits((prev) => prev - COST_PER_UNLOCK);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, is_unlocked: true } : l)),
    );

    await supabase
      .from("users")
      .update({ credits: userCredits - COST_PER_UNLOCK })
      .eq("id", user.id);
    await supabase
      .from("user_leads")
      .update({ is_unlocked: true })
      .eq("user_id", user.id)
      .eq("lead_id", leadId);
  };

  // --- 5. BULK UNLOCK ---
  const unlockAllLeads = async (leadIds: string[]) => {
    const cost = leadIds.length * COST_PER_UNLOCK;
    if (cost === 0) return;

    if (userCredits < cost) {
      toast({
        title: "Insufficient Credits",
        description: `Need ${cost} credits.`,
        variant: "destructive",
      });
      return;
    }

    setUserCredits((prev) => prev - cost);
    setLeads((prev) =>
      prev.map((l) =>
        leadIds.includes(l.id) ? { ...l, is_unlocked: true } : l,
      ),
    );

    try {
      const res = await fetch("/api/extract/leads/unlock-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });
      if (res.status === 404) throw new Error("API Route Not Found");
      if (!res.ok) throw new Error("Failed");

      toast({
        title: "Leads Unlocked",
        description: `Unlocked ${leadIds.length} leads.`,
      });
    } catch (error) {
      setUserCredits((prev) => prev + cost);
      setLeads((prev) =>
        prev.map((l) =>
          leadIds.includes(l.id) ? { ...l, is_unlocked: false } : l,
        ),
      );
      toast({
        title: "Error",
        description: "Failed to unlock.",
        variant: "destructive",
      });
    }
  };

  const clearData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_leads").delete().eq("user_id", user.id);
    await supabase.from("monitors").delete().eq("user_id", user.id);
    setLeads([]);
    setMonitors([]);
  };

  const deleteMonitor = async (monitorId: string) => {
    try {
      await fetch(`/api/extract/monitors?id=${monitorId}`, {
        method: "DELETE",
      });
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
    } catch (e) {}
  };

  const updateMonitor = async (
    monitorId: string,
    updates: Partial<Monitor>,
  ) => {
    await supabase.from("monitors").update(updates).eq("id", monitorId);
    setMonitors((prev) =>
      prev.map((m) => (m.id === monitorId ? { ...m, ...updates } : m)),
    );
  };

  return (
    <DataContext.Provider
      value={{
        leads,
        monitors,
        userCredits,
        scansThisMonth,
        userEmail,
        addMonitor,
        startScrape,
        unlockLead,
        unlockAllLeads,
        clearData,
        deleteMonitor,
        updateMonitor,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
