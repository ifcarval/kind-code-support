import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

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
    
    // Fetch Client Data
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    
    setClient(clientData);

    // Fetch Contracted Services
    const { data: servicesData } = await supabase
      .from("client_services")
      .select("*")
      .eq("client_id", clientId);
    
    setServices(servicesData || []);

    // Fetch Invoices
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", clientId)
      .order("data_vencimento", { ascending: false });
    
    setInvoices(invoicesData || []);

    // Calculate Stats
    if (invoicesData) {
      const today = new Date();
      const totals = invoicesData.reduce((acc, inv) => {
        acc.totalFaturado += inv.valor_final;
        
        if (inv.status === "paga") {
          acc.totalPago += inv.valor_final;
        } else if (inv.status === "pendente" || inv.status === "vencida") {
          acc.totalEmAberto += inv.valor_final;
          
          if (new Date(inv.data_vencimento) < today && inv.status !== "paga") {
            acc.totalVencido += inv.valor_final;
          }
        }
        
        return acc;
      }, {
        totalFaturado: 0,
        totalPago: 0,
        totalEmAberto: 0,
        totalVencido: 0,
      });
      
      setStats(totals);
    }

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
