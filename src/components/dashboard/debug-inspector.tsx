"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function DebugInspector() {
  const supabase = createClientComponentClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any>(null);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    const runDiagnostics = async () => {
      addLog("🚀 Starting Diagnostics...");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        addLog("❌ No User Logged In.");
        return;
      }
      addLog(`✅ User Found: ${user.id}`);

      // 1. Check Monitors
      const { data: monitors, error: monError } = await supabase
        .from("monitors")
        .select("id, keyword, user_id")
        .eq("user_id", user.id);

      if (monError) {
        addLog(`❌ Monitor Fetch Error: ${monError.message}`);
        return;
      }
      addLog(`✅ Monitors Found: ${monitors?.length}`);
      if (monitors && monitors.length > 0) {
        addLog(`   First Monitor ID: ${monitors[0].id}`);
      }

      // 2. Check Leads (RAW - No Filters first)
      // We fetch ALL leads to see if RLS is hiding them
      const { data: allLeads, error: leadError } = await supabase
        .from("leads")
        .select("id, business_name, monitor_id");

      if (leadError) {
        addLog(`❌ Lead Fetch Error: ${leadError.message}`);
      } else {
        addLog(`🔎 Total Leads Visible in DB: ${allLeads?.length}`);
        setRawData(allLeads);

        // 3. Check Matching
        if (monitors && allLeads) {
          const monitorIds = monitors.map((m) => m.id);
          const matches = allLeads.filter((l) =>
            monitorIds.includes(l.monitor_id),
          );
          addLog(`🎯 Leads matching your Monitors: ${matches.length}`);

          if (matches.length === 0 && allLeads.length > 0) {
            addLog("⚠️ MISMATCH DETECTED!");
            addLog(`   Monitor ID expected: ${monitors[0].id}`);
            addLog(`   Lead has monitor_id: ${allLeads[0].monitor_id}`);
          }
        }
      }
    };

    runDiagnostics();
  }, [supabase]);

  return (
    <div className="p-6 my-4 bg-slate-950 border-2 border-yellow-400 rounded-xl text-green-400 font-mono text-xs overflow-hidden shadow-2xl">
      <h3 className="text-yellow-400 font-bold text-lg mb-4">
        🕵️ AlphaLeads Inspector
      </h3>
      <div className="space-y-1 mb-6">
        {logs.map((log, i) => (
          <div key={i} className="border-b border-white/10 pb-1">
            {log}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <strong className="text-white block mb-2">Raw Leads Data:</strong>
          <pre className="bg-black p-2 rounded max-h-40 overflow-auto">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
