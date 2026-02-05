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

interface DataContextType {
  leads: Lead[];
  monitors: Monitor[];
  userCredits: number;
  userEmail: string | undefined;
  addMonitor: (monitor: Partial<Monitor>) => Promise<boolean>;
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

  // 1. CENTRAL FETCH FUNCTION (Reusable)
  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email);

    // A. Fetch Credits
    const { data: userData } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (userData) setUserCredits(userData.credits);

    // B. Fetch Monitors
    const { data: monitorData } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (monitorData) {
      setMonitors(monitorData);
    }

    // C. Fetch Leads (Using the new user_leads mapping)
    // First, find which leads belong to this user
    const { data: linkData } = await supabase
      .from("user_leads")
      .select("lead_id, is_unlocked")
      .eq("user_id", user.id);

    if (linkData && linkData.length > 0) {
      const leadIds = linkData.map((link) => link.lead_id);

      // Then fetch the actual business data
      const { data: businessData } = await supabase
        .from("leads")
        .select("*")
        .in("id", leadIds);

      if (businessData) {
        // Merge the 'is_unlocked' status into the business object
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
      setLeads([]); // No leads linked yet
    }
  }, [supabase]);

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. ADD MONITOR (With Vercel-Safe Polling)
  const addMonitor = async (newMonitor: Partial<Monitor>): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // A. Pause existing active monitors (Single Active Monitor Rule)
    const { data: existingActive } = await supabase
      .from("monitors")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (existingActive && existingActive.length > 0) {
      await supabase
        .from("monitors")
        .update({ status: "paused" })
        .in(
          "id",
          existingActive.map((m) => m.id),
        );
    }

    // B. Insert New Monitor into DB
    const fullMonitor = { ...newMonitor, user_id: user.id, status: "active" };
    const { data: savedMonitor, error } = await supabase
      .from("monitors")
      .insert(fullMonitor)
      .select()
      .single();

    if (error || !savedMonitor) {
      console.error("DB Insert Error:", error);
      return false;
    }

    // Update Local UI instantly
    setMonitors((prev) => {
      const paused = prev.map((m) => ({ ...m, status: "paused" as const }));
      return [savedMonitor, ...paused];
    });

    // C. START THE JOB (Step 1: Get Ticket)
    try {
      console.log("🚀 Starting Scrape Job...");
      const startRes = await fetch("/api/extract/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newMonitor.keyword,
          location: newMonitor.location,
          limit: 20, // Keep safe limit for now
        }),
      });

      const startData = await startRes.json();
      if (!startData.success) throw new Error("Failed to start job");

      const requestId = startData.requestId;
      console.log(`🎫 Job ID: ${requestId}. Polling for results...`);

      // D. POLL FOR RESULTS (Step 2: The Browser Waiting Room)
      // This runs on the client, so Vercel won't time out.
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s * 60)

      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          console.error("Scraping timed out.");
          return;
        }

        try {
          // Ask server: "Is it done?"
          const checkRes = await fetch("/api/extract/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId }),
          });
          const checkData = await checkRes.json();

          if (checkData.status === "SUCCESS") {
            // SUCCESS!
            clearInterval(pollInterval);
            console.log(`✅ Scrape Complete! Found ${checkData.count} leads.`);

            // Re-fetch data from Supabase to show new leads
            await fetchData();
          } else {
            // Still waiting...
            console.log(
              `... still processing (Attempt ${attempts}/${maxAttempts})`,
            );
          }
        } catch (pollError) {
          console.error("Polling check failed", pollError);
        }
      }, 5000); // Check every 5 seconds
    } catch (apiError) {
      console.error("Scraping Initialization Failed:", apiError);
    }

    return true;
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

    // Optimistic UI update
    setUserCredits(newCredits);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, is_unlocked: true } : l)),
    );

    // DB Update: Credits
    await supabase
      .from("users")
      .update({ credits: newCredits })
      .eq("id", user.id);

    // DB Update: Link Status
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

    // Delete user's links and monitors
    // (We do NOT delete from 'leads' table, that's the shared dictionary)
    await supabase.from("user_leads").delete().eq("user_id", user.id);
    await supabase.from("monitors").delete().eq("user_id", user.id);

    setLeads([]);
    setMonitors([]);
  };

  const deleteMonitor = async (monitorId: string) => {
    // Note: In new system, deleting monitor doesn't strictly delete leads
    // unless we track which monitor found which lead.
    // For now, we just delete the monitor record.

    await supabase.from("monitors").delete().eq("id", monitorId);
    setMonitors((prev) => prev.filter((m) => m.id !== monitorId));

    // Optional: Reactivate old monitor
    // ... (logic remains same if needed)
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
