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
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient();

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email);

    // Get Credits
    const { data: userData } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single();
    if (userData) setUserCredits(userData.credits);

    // Get Monitors
    const { data: monitorData } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (monitorData) setMonitors(monitorData);

    // Get Leads & Unlock Status
    // We fetch the 'user_leads' junction table to see what is unlocked
    const { data: linkData } = await supabase
      .from("user_leads")
      .select("lead_id, is_unlocked")
      .eq("user_id", user.id);

    if (linkData && linkData.length > 0) {
      const leadIds = linkData.map((link) => link.lead_id);

      // Fetch the actual lead details
      const { data: businessData } = await supabase
        .from("leads")
        .select("*")
        .in("id", leadIds);

      if (businessData) {
        // Merge the "is_unlocked" status into the lead object
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

  // --- 2. ADD MONITOR (Via API) ---
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

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to add monitor" };
      }

      setMonitors((prev) => [data.monitor, ...prev]);
      return { success: true };
    } catch (error: any) {
      console.error("Add Monitor Error:", error);
      return { success: false, error: error.message };
    }
  };

  // --- 3. START SCRAPE (With Refund Logic) ---
  const startScrape = async (monitor: Monitor) => {
    const COST = 10;

    if (userCredits < COST) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${COST} credits. You have ${userCredits}.`,
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI Update
    setUserCredits((prev) => prev - COST);
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
      if (!startRes.ok) throw new Error(startData.error || "Failed to start");

      const requestId = startData.requestId;

      // POLLING LOOP
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        // Timeout after ~5 minutes
        if (attempts > 60) {
          clearInterval(pollInterval);
          setMonitors((prev) =>
            prev.map((m) =>
              m.id === monitor.id ? { ...m, status: "paused" } : m,
            ),
          );
          toast({
            title: "Timeout",
            description: "Scrape took too long. Please try again.",
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
            await fetchData(); // Reload leads
            toast({
              title: "Scan Complete",
              description: `Found ${checkData.count} new leads.`,
            });
            setMonitors((prev) =>
              prev.map((m) =>
                m.id === monitor.id ? { ...m, status: "paused" } : m,
              ),
            );
          } else if (checkData.status === "ZERO_RESULTS") {
            // REFUND LOGIC
            clearInterval(pollInterval);
            setUserCredits((prev) => prev + 10); // Refund UI
            toast({
              variant: "destructive",
              title: "No Results",
              description: "Credits refunded. Please check your spelling.",
            });
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
      setUserCredits((prev) => prev + COST); // Revert credits on error
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

    if (userCredits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need 1 credit to unlock this lead.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI
    setUserCredits((prev) => prev - 1);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, is_unlocked: true } : l)),
    );

    // DB Update
    await supabase
      .from("users")
      .update({ credits: userCredits - 1 })
      .eq("id", user.id);

    await supabase
      .from("user_leads")
      .update({ is_unlocked: true })
      .eq("user_id", user.id)
      .eq("lead_id", leadId);
  };

  // --- 5. UNLOCK ALL LEADS (The "Bulk" Feature) ---
  const unlockAllLeads = async (leadIds: string[]) => {
    const cost = leadIds.length;
    if (cost === 0) return;

    if (userCredits < cost) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${cost} credits. You have ${userCredits}.`,
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI Update
    setUserCredits((prev) => prev - cost);
    setLeads((prev) =>
      prev.map((l) =>
        leadIds.includes(l.id) ? { ...l, is_unlocked: true } : l,
      ),
    );

    try {
      // API Call
      const res = await fetch("/api/extract/leads/unlock-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });

      // CTO CHECK: Detailed Error Reporting
      if (res.status === 404) {
        throw new Error(
          "API Route Not Found. Missing file: api/extract/leads/unlock-all/route.ts",
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock leads");
      }

      toast({
        title: "Leads Unlocked",
        description: `Successfully unlocked ${cost} leads.`,
      });
    } catch (error: any) {
      console.error("Unlock Error:", error);

      // Revert Optimistic Update
      setUserCredits((prev) => prev + cost);
      setLeads((prev) =>
        prev.map((l) =>
          leadIds.includes(l.id) ? { ...l, is_unlocked: false } : l,
        ),
      );

      toast({
        title: "Error",
        description: error.message || "Failed to unlock leads.",
        variant: "destructive",
      });
    }
  };

  // --- 6. UTILITIES ---
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
    } catch (e) {
      console.error(e);
    }
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
