import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";

export interface FinanceItem {
  id: string;
  organization_id: string;
  event_id?: string | null;
  contract_id?: string | null;
  description: string;
  type: 'income' | 'expense';
  category?: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  transaction_date?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  event?: { title: string } | null;
  contract?: { contract_number: string } | null;
}

export function useFinances() {
  const [finances, setFinances] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  const fetchFinances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("finances" as any)
      .select(`
        *,
        event:events(title),
        contract:contracts(contract_number)
      `)
      .order("due_date", { ascending: false });

    if (!error && data) {
      setFinances(data as unknown as FinanceItem[]);
    }
    setLoading(false);
  };

  const createFinance = async (item: Partial<FinanceItem>) => {
    const orgId = profile?.organization_id || (await supabase.auth.getSession()).data.session?.user.id;
    const payload = {
      ...item,
      organization_id: profile?.organization_id || orgId
    };
    const { data, error } = await supabase
      .from("finances" as any)
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      setFinances(prev => [data as unknown as FinanceItem, ...prev]);
    }
    return { data, error };
  };

  const updateFinance = async (id: string, item: Partial<FinanceItem>) => {
    const { data, error } = await supabase
      .from("finances" as any)
      .update(item)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setFinances(prev => prev.map(f => f.id === id ? (data as unknown as FinanceItem) : f));
    }
    return { data, error };
  };

  const deleteFinance = async (id: string) => {
    const { error } = await supabase
      .from("finances" as any)
      .delete()
      .eq("id", id);

    if (!error) {
      setFinances(prev => prev.filter(f => f.id !== id));
    }
    return { error };
  };

  const calculateReceiptsByEvent = (eventId: string) => {
    return finances
      .filter(f => f.event_id === eventId && f.type === 'income' && f.status === 'paid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  };

  const stats = finances.reduce((acc, f) => {
    if (f.type === 'income') {
      if (f.status === 'paid') acc.totalReceived += f.amount;
      if (f.status === 'pending' || f.status === 'overdue') acc.totalPending += f.amount;
    } else {
      if (f.status === 'paid') acc.totalPaid += f.amount;
    }
    acc.balance = acc.totalReceived - acc.totalPaid;
    return acc;
  }, { totalReceived: 0, totalPaid: 0, totalPending: 0, balance: 0 });

  useEffect(() => {
    fetchFinances();
  }, []);

  return {
    finances,
    loading,
    stats,
    fetchFinances,
    createFinance,
    updateFinance,
    deleteFinance,
    calculateReceiptsByEvent
  };
}
