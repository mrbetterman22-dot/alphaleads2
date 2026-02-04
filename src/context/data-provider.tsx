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
  addMonitor: (monitor: Partial<Monitor>) => Promise<void>;
  unlockLead: (leadId: string) => Promise<void>;
  clearData: () => Promise<void>; // Added to fix your Reset button
  deleteMonitor: (monitorId: string) => Promise<void>;
  updateMonitor: (monitorId: string, updates: Partial<Monitor>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // FIX: Use user_id (with underscore) to match Supabase
      const { data: monitorData } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user.id);

      if (monitorData) {
        setMonitors(monitorData);

        // FIX: Use monitor_id (with underscore) to match Supabase
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

  const addMonitor = async (newMonitor: Partial<Monitor>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // FIX: Use user_id here as well
    const fullMonitor = { ...newMonitor, user_id: user.id, status: "active" };
    const { error } = await supabase.from("monitors").insert(fullMonitor);
    if (!error) {
      // Refresh monitors to get the database-generated ID
      const { data } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user.id);
      if (data) setMonitors(data);
    }
  };

  const unlockLead = async (leadId: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ is_unlocked: true }) // FIX: use is_unlocked
      .eq("id", leadId);

    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, is_unlocked: true } : l)),
      );
    }
  };

  // Added this function so your Reset button works
  const clearData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Delete leads first because they depend on monitors
    const monitorIds = monitors.map((m) => m.id);
    await supabase.from("leads").delete().in("monitor_id", monitorIds);
    await supabase.from("monitors").delete().eq("user_id", user.id);

    setLeads([]);
    setMonitors([]);
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

  const deleteMonitor = async (monitorId: string) => {
    // First, delete leads associated with the monitor
    await supabase.from("leads").delete().eq("monitor_id", monitorId);

    // Then, delete the monitor itself
    const { error } = await supabase
      .from("monitors")
      .delete()
      .eq("id", monitorId);

    if (!error) {
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
      setLeads((prev) => prev.filter((l) => l.monitor_id !== monitorId));
    }
  };

  return (
    <DataContext.Provider
      value={{
        leads,
        monitors,
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
