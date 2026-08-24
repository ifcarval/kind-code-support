import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    
    // As views no Supabase funcionam como tabelas para o JS Client
    const { data: statsData } = await supabase
      .from("dashboard_stats" as any)
      .select("*")
      .single();

    const { data: historyData } = await supabase
      .from("monthly_billing_history" as any)
      .select("*")
      .order("competencia", { ascending: false })
      .limit(6);

    if (statsData) setStats(statsData);
    if (historyData) setHistory(historyData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, history, loading, refresh: fetchStats };
}
