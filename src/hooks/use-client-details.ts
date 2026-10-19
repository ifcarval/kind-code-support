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
    
    // Fetch Client Data from clients table
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    
    setClient(clientData);

    // Fetch related services/contracts if applicable
    const { data: servicesData } = await supabase
      .from("client_services")
      .select("*")
      .eq("client_id", clientId);

    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", clientId);

    setServices(servicesData || []);
    setInvoices(invoicesData || []);

    let faturado = 0;
    let pago = 0;
    let aberto = 0;
    let vencido = 0;

    (invoicesData || []).forEach((inv: any) => {
      const val = Number(inv.valor_final || 0);
      faturado += val;
      if (inv.status === 'paga') pago += val;
      else if (inv.status === 'vencida') vencido += val;
      else aberto += val;
    });

    setStats({
      totalFaturado: faturado,
      totalPago: pago,
      totalEmAberto: aberto,
      totalVencido: vencido,
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
