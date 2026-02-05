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
  updateMonitor: (
    monitorId: string,
    updates: Partial<Monitor>,
  ) => Promise<void>;
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

    // 1. Find and deactivate any existing active monitors for this location
    const { data: existingMonitors, error: fetchError } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .eq("location", newMonitor.location)
      .eq("status", "active");

    if (fetchError) {
      console.error("Error fetching existing monitors:", fetchError);
      return;
    }

    if (existingMonitors && existingMonitors.length > 0) {
      const { error: updateError } = await supabase
        .from("monitors")
        .update({ status: "paused" })
        .in(
          "id",
          existingMonitors.map((m) => m.id),
        );
      if (updateError) {
        console.error("Error deactivating existing monitors:", updateError);
        return;
      }
    }

    // 2. Add the new monitor as active
    const fullMonitor = { ...newMonitor, user_id: user.id, status: "active" };
    const { error } = await supabase.from("monitors").insert(fullMonitor);

    if (!error) {
      // Refresh monitors to get the database-generated ID and updated statuses
      const { data } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user.id);
      if (data) setMonitors(data);
    } else {
      console.error("Error adding new monitor:", error);
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
    // Get the monitor details before deleting
    const monitorToDelete = monitors.find((m) => m.id === monitorId);
    if (!monitorToDelete) {
      console.error("Monitor not found for deletion.");
      return;
    }

    // First, delete leads associated with the monitor
    await supabase.from("leads").delete().eq("monitor_id", monitorId);

    // Then, delete the monitor itself
    const { error } = await supabase
      .from("monitors")
      .delete()
      .eq("id", monitorId);

    if (!error) {
      // Update local state first
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
      setLeads((prev) => prev.filter((l) => l.monitor_id !== monitorId));

      // If the deleted monitor was active, try to reactivate a paused one for the same location
      if (monitorToDelete.status === "active") {
        const { data: pausedMonitors, error: fetchPausedError } = await supabase
          .from("monitors")
          .select("*")
          .eq("user_id", monitorToDelete.user_id)
          .eq("location", monitorToDelete.location)
          .eq("status", "paused")
          .order("id", { ascending: false }) // Assuming higher ID means more recent
          .limit(1);

        if (fetchPausedError) {
          console.error("Error fetching paused monitors:", fetchPausedError);
          return;
        }

        if (pausedMonitors && pausedMonitors.length > 0) {
          const monitorToReactivate = pausedMonitors[0];
          const { error: reactivateError } = await supabase
            .from("monitors")
            .update({ status: "active" })
            .eq("id", monitorToReactivate.id);

          if (reactivateError) {
            console.error(
              "Error reactivating previous monitor:",
              reactivateError,
            );
          } else {
            // Refresh monitors after reactivation
            const { data } = await supabase
              .from("monitors")
              .select("*")
              .eq("user_id", monitorToDelete.user_id);
            if (data) setMonitors(data);
          }
        }
      }
    } else {
      console.error("Error deleting monitor:", error);
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
