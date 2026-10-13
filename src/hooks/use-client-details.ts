import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useClientDetails(clientId: string) {
  const [client, setClient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFaturado: 0,
    totalPago: 0,
    totalEmAberto: 0,
    totalVencido: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Customer Data from customers table
    const { data: clientData } = await supabase
      .from("customers")
      .select("*")
      .eq("id", clientId)
      .single();
    
    setClient(clientData);

    // Fetch related services/contracts if applicable
    setServices([]);
    setInvoices([]);
    setStats({
      totalFaturado: 0,
      totalPago: 0,
      totalEmAberto: 0,
      totalVencido: 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  return {
    client,
    services,
    invoices,
    stats,
    loading,
    refetch: fetchData
  };
}
