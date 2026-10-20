import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContractItem {
  id: string;
  organization_id: string;
  customer_id?: string | null;
  event_id?: string | null;
  template_id?: string | null;
  contract_number: string;
  status: string;
  released?: boolean;
  current_version: number;
  payment_method?: string | null;
  deposit_amount?: number | null;
  signal_amount?: number | null;
  discount_amount?: number | null;
  installments_count?: number | null;
  fine_percentage?: number | null;
  interest_percentage?: number | null;
  clauses?: string | null;
  total_amount?: number | null;
  signed_manually?: boolean | null;
  signed_at?: string | null;
  snapshot_variables?: any | null;
  customer?: { name: string } | null;
  event?: { title: string } | null;
}

export function useContractsManager() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts" as any)
      .select(`
        *,
        customer:customers(name),
        event:events(title)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setContracts(data as unknown as ContractItem[]);
    }
    setLoading(false);
  };

  const createContract = async (payload: Partial<ContractItem>) => {
    // Validação obrigatória de organizationId conforme diretrizes
    let orgId = payload.organization_id;
    
    if (!orgId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (membership && (membership as any).organization_id) {
          orgId = (membership as any).organization_id;
        }
      }
    }

    if (!orgId) {
      throw new Error('Organização não identificada.');
    }

    const dataToInsert = {
      ...payload,
      organization_id: orgId,
      contract_number: payload.contract_number || `CTR-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const { data, error } = await supabase
      .from("contracts" as any)
      .insert([dataToInsert])
      .select()
      .single();

    if (!error && data) {
      await supabase.from("contract_versions" as any).insert([{
        contract_id: (data as any).id,
        version_number: 1,
        snapshot_data: data
      }]);
      setContracts(prev => [data as unknown as ContractItem, ...prev]);
    }
    return { data, error };
  };

  const updateContract = async (id: string, payload: Partial<ContractItem>) => {
    const target = contracts.find(c => c.id === id);
    const newVersion = (target?.current_version || 1) + 1;

    const { data, error } = await supabase
      .from("contracts" as any)
      .update({ ...payload, current_version: newVersion })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      await supabase.from("contract_versions" as any).insert([{
        contract_id: id,
        version_number: newVersion,
        snapshot_data: data
      }]);
      setContracts(prev => prev.map(c => c.id === id ? (data as unknown as ContractItem) : c));
    }
    return { data, error };
  };

  const duplicateContract = async (id: string) => {
    const target = contracts.find(c => c.id === id);
    if (!target) return;
    const { id: _, created_at, updated_at, ...rest } = target as any;
    return createContract({
      ...rest,
      contract_number: `${rest.contract_number}-DUP`,
      status: 'draft',
      released: false
    });
  };

  const signManually = async (id: string) => {
    return updateContract(id, {
      signed_manually: true,
      signed_at: new Date().toISOString(),
      status: 'active'
    });
  };

  const releaseContract = async (id: string) => {
    return updateContract(id, {
      released: true,
      status: 'active'
    });
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return {
    contracts,
    loading,
    fetchContracts,
    createContract,
    updateContract,
    duplicateContract,
    signManually,
    releaseContract
  };
}
