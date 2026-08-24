import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [profitableServices, setProfitableServices] = useState<any[]>([]);
  const [delinquentClients, setDelinquentClients] = useState<any[]>([]);
  const [upcomingDates, setUpcomingDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    
    try {
      // Basic stats from the new view
      const { data: statsData } = await supabase
        .from("advanced_dashboard_stats" as any)
        .select("*")
        .maybeSingle();

      // Monthly revenue history (12 months)
      const { data: historyData } = await supabase
        .from("monthly_revenue_history" as any)
        .select("*")
        .order("month", { ascending: true });

      // Status distribution for pie chart
      const { data: statusData } = await supabase
        .from("billing_status_distribution" as any)
        .select("*");

      // Top clients
      const { data: topClientsData } = await supabase
        .from("top_clients_revenue" as any)
        .select("*")
        .limit(5);

      // Profitable services
      const { data: servicesData } = await supabase
        .from("profitable_services" as any)
        .select("*")
        .limit(5);

      // Delinquent clients
      const { data: delinquentData } = await supabase
        .from("delinquent_clients" as any)
        .select("*")
        .limit(5);

      // Upcoming due dates
      const { data: upcomingData } = await supabase
        .from("upcoming_due_dates" as any)
        .select("*")
        .limit(5);

      if (statsData) setStats(statsData);
      if (historyData) setHistory(historyData);
      if (statusData) setStatusDistribution(statusData);
      if (topClientsData) setTopClients(topClientsData);
      if (servicesData) setProfitableServices(servicesData);
      if (delinquentData) setDelinquentClients(delinquentData);
      if (upcomingData) setUpcomingDates(upcomingData);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { 
    stats, 
    history, 
    statusDistribution,
    topClients,
    profitableServices,
    delinquentClients,
    upcomingDates,
    loading, 
    refresh: fetchStats 
  };
}
