// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Lead, Monitor } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveLeads(leads: Lead[]) {
  const { data, error } = await supabase.from("leads").insert(leads); // Supabase handles the mapping to columns

  if (error) throw error;
  return data;
}

export async function getUserMonitors(userId: string) {
  const { data, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("user_id", userId); // Matches your new column name

  if (error) throw error;
  return data as Monitor[];
}
