import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export function useBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        client:clients(nome_razao_social)
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
    forma_pagamento: PaymentMethod;
    referencia_pagamento?: string;
    observacoes?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa não encontrada" };

    const { error } = await supabase.from("payments").insert({
      invoice_id: paymentData.invoice_id,
      valor_pago: paymentData.valor_pago,
      forma_pagamento: paymentData.forma_pagamento,
      referencia_pagamento: paymentData.referencia_pagamento ?? null,
      observacoes: paymentData.observacoes ?? null,
      company_id: profile.company_id,
    });

    if (!error) {
      await fetchInvoices();
    }
    return { error };
  };

  const generateMonthlyInvoices = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase.rpc("generate_monthly_invoices", {
      _target_month: today as any,
    });

    if (!error) {
      await fetchInvoices();
    }
    return { data, error };
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    fetchInvoices,
    registerPayment,
    generateMonthlyInvoices,
  };
}
