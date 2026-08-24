import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export function useBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_pending: 0,
    total_overdue: 0,
    total_paid: 0,
  });

  const fetchInvoices = async (filters?: {
    search?: string;
    status?: string;
    client_id?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    setLoading(true);
    let query = supabase
      .from("invoices")
      .select(`
        *,
        client:clients(nome_razao_social),
        items:invoice_items(*)
      `);

    if (filters?.search) {
      // Busca simplificada por número da fatura ou descrição
      query = query.or(`numero_fatura.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`);
    }

    if (filters?.status && filters.status !== "todos") {
      query = query.eq("status", filters.status as any);
    }

    if (filters?.client_id && filters.client_id !== "todos") {
      query = query.eq("client_id", filters.client_id);
    }

    if (filters?.date_from) {
      query = query.gte("data_vencimento", filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte("data_vencimento", filters.date_to);
    }

    const { data, error } = await query.order("data_vencimento", { ascending: false });

    if (!error) {
      setInvoices(data || []);
      
      // Calcular estatísticas básicas baseadas nos dados filtrados ou todos? 
      // Geralmente indicadores mostram o total geral da empresa.
      const { data: allStats } = await supabase
        .from("invoices")
        .select("status, valor_final");
      
      if (allStats) {
        const summary = allStats.reduce((acc: any, inv: any) => {
          if (inv.status === 'pendente') acc.total_pending += inv.valor_final;
          if (inv.status === 'vencida') acc.total_overdue += inv.valor_final;
          if (inv.status === 'paga') acc.total_paid += inv.valor_final;
          return acc;
        }, { total_pending: 0, total_overdue: 0, total_paid: 0 });
        setStats(summary);
      }
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

  const sendInvoiceReminder = async (invoiceId: string, templateId: string) => {
    const { sendReminder } = await import("@/lib/notifications.functions");
    try {
      const result = await sendReminder({ data: { invoiceId, templateId } });
      if (result.success) {
        await fetchInvoices();
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    invoices,
    loading,
    stats,
    fetchInvoices,
    registerPayment,
    generateMonthlyInvoices,
    sendInvoiceReminder,
  };
}
