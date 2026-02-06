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
import { toast } from "@/hooks/use-toast"; // Ensure you have this or use alert

interface DataContextType {
  leads: Lead[];
  monitors: Monitor[];
  userCredits: number;
  userEmail: string | undefined;
  addMonitor: (monitor: Partial<Monitor>) => Promise<boolean>;
  startScrape: (monitor: Monitor) => Promise<void>;
  unlockLead: (leadId: string) => Promise<void>;
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

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email);

    const { data: userData } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (userData) setUserCredits(userData.credits);

    const { data: monitorData } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (monitorData) {
      setMonitors(monitorData);
    }

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
          return {
            ...biz,
            is_unlocked: link?.is_unlocked || false,
          };
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

  const addMonitor = async (newMonitor: Partial<Monitor>): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // Default status is "paused"
    const fullMonitor = { ...newMonitor, user_id: user.id, status: "paused" };

    const { data: savedMonitor, error } = await supabase
      .from("monitors")
      .insert(fullMonitor)
      .select()
      .single();

    if (error || !savedMonitor) {
      console.error("DB Insert Error:", error);
      return false;
    }

    setMonitors((prev) => [savedMonitor, ...prev]);
    return true;
  };

  // --- UPDATED: START SCRAPE WITH COST ---
  const startScrape = async (monitor: Monitor) => {
    const COST = 10;

    // 1. Check Credits
    if (userCredits < COST) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${COST} credits to start a scan. You have ${userCredits}.`,
        variant: "destructive",
      });
      return;
    }

    // 2. Deduct Credits Optimistically
    const newBalance = userCredits - COST;
    setUserCredits(newBalance);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("users")
        .update({ credits: newBalance })
        .eq("id", user.id);
    }

    // 3. Update UI to "Active"
    const updateLocalStatus = (id: string, status: "active" | "paused") => {
      setMonitors((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m)),
      );
    };
    updateLocalStatus(monitor.id, "active");

    // 4. Run the Job
    try {
      console.log(`🚀 Starting scrape (-${COST} credits)...`);

      const startRes = await fetch("/api/extract/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: monitor.keyword,
          location: monitor.location,
          limit: 20,
        }),
      });

      const startData = await startRes.json();
      if (!startData.success) throw new Error("Failed to start job");

      const requestId = startData.requestId;

      // 5. Poll
      let attempts = 0;
      const maxAttempts = 120;

      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          updateLocalStatus(monitor.id, "paused");
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
            await fetchData();
            updateLocalStatus(monitor.id, "paused");
            toast({
              title: "Scan Complete",
              description: `Found ${checkData.count} new leads.`,
            });
          }
        } catch (pollError) {
          console.error("Polling error", pollError);
        }
      }, 5000);
    } catch (error) {
      console.error("Scrape failed", error);
      updateLocalStatus(monitor.id, "paused");
      // Refund on failure? Optional, but safer to keep it simple for now.
      alert("Failed to start scraper. Check console.");
    }
  };

  const unlockLead = async (leadId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (userCredits < 1) {
      alert("Not enough credits");
      return;
    }
    const newCredits = userCredits - 1;
    setUserCredits(newCredits);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, is_unlocked: true } : l)),
    );
    await supabase
      .from("users")
      .update({ credits: newCredits })
      .eq("id", user.id);
    await supabase
      .from("user_leads")
      .update({ is_unlocked: true })
      .eq("user_id", user.id)
      .eq("lead_id", leadId);
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
    await supabase.from("monitors").delete().eq("id", monitorId);
    setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
  };

  const updateMonitor = async (
    monitorId: string,
    updates: Partial<Monitor>,
  ) => {
    const { error } = await supabase
      .from("monitors")
      .update(updates)
      .eq("id", monitorId);
    if (!error) {
      setMonitors((prev) =>
        prev.map((m) => (m.id === monitorId ? { ...m, ...updates } : m)),
      );
    }
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
