"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Lead, Monitor } from "@/lib/types";

interface DataContextType {
  leads: Lead[];
  monitors: Monitor[];
  userCredits: number;
  userEmail: string | undefined; // NEW: Added userEmail
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
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined); // NEW: State for email
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No user found.");
        return;
      }

      // NEW: Set the email
      setUserEmail(user.email);

      // Fetch user credits
      const { data: userData } = await supabase
        .from("users")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (userData) {
        setUserCredits(userData.credits);
      } else {
        setUserCredits(0);
      }

      // Fetch Monitors
      const { data: monitorData } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user.id);

      if (monitorData) {
        setMonitors(monitorData);

        const { data: leadData } = await supabase
          .from("leads")
          .select("*")
          .in(
            "monitor_id",
            monitorData.map((m) => m.id),
          );

        if (leadData) setLeads(leadData);
      }
    };

    fetchData();
  }, [supabase]);

  // ... (Keep your existing addMonitor, unlockLead, etc. logic)
  const addMonitor = async (newMonitor: Partial<Monitor>): Promise<boolean> => {
    // (Your existing code here)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // ... logic to pause others and insert new one
    const { data: existingMonitors } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .eq("location", newMonitor.location)
      .eq("status", "active");
    if (existingMonitors && existingMonitors.length > 0) {
      await supabase
        .from("monitors")
        .update({ status: "paused" })
        .in(
          "id",
          existingMonitors.map((m) => m.id),
        );
    }

    const fullMonitor = { ...newMonitor, user_id: user.id, status: "active" };
    const { error } = await supabase.from("monitors").insert(fullMonitor);

    if (!error) {
      const { data } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user.id);
      if (data) setMonitors(data);
      return true;
    }
    return false;
  };

  const unlockLead = async (leadId: string) => {
    // (Your existing code here)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const newCredits = userCredits - 1;
    const { error } = await supabase
      .from("users")
      .update({ credits: newCredits })
      .eq("id", user.id);
    if (!error) {
      await supabase
        .from("leads")
        .update({ is_unlocked: true })
        .eq("id", leadId);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, is_unlocked: true } : l)),
      );
      setUserCredits(newCredits);
    }
  };

  const clearData = async () => {
    // (Your existing code here)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const monitorIds = monitors.map((m) => m.id);
    await supabase.from("leads").delete().in("monitor_id", monitorIds);
    await supabase.from("monitors").delete().eq("user_id", user.id);
    setLeads([]);
    setMonitors([]);
  };

  const deleteMonitor = async (monitorId: string) => {
    // (Your existing code here)
    const monitorToDelete = monitors.find((m) => m.id === monitorId);
    if (!monitorToDelete) return;
    await supabase.from("leads").delete().eq("monitor_id", monitorId);
    const { error } = await supabase
      .from("monitors")
      .delete()
      .eq("id", monitorId);
    if (!error) {
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
      setLeads((prev) => prev.filter((l) => l.monitor_id !== monitorId));
      // ... Reactivation logic ...
    }
  };

  const updateMonitor = async (
    monitorId: string,
    updates: Partial<Monitor>,
  ) => {
    // (Your existing code here)
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
        userEmail, // NEW: Expose email
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
