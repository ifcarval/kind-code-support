import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        client:clients(name)
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const registerPayment = async (paymentData: {
    invoice_id: string;
    valor_pago: number;
    forma_pagamento: string;
    referencia_pagamento?: string;
    observacoes?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Buscar company_id do usuário/perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa não encontrada" };

    const { error } = await supabase.from("payments").insert({
      ...paymentData,
      company_id: profile.company_id,
    });

    if (!error) {
      await fetchInvoices();
    }
    return { error };
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    fetchInvoices,
    registerPayment,
  };
}
