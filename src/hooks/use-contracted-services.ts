import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type ClientService = Database["public"]["Tables"]["client_services"]["Row"] & {
  client?: { nome_razao_social: string };
  service?: { nome: string };
};

export function useContractedServices() {
  const [contractedServices, setContractedServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContractedServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_services")
      .select(`
        *,
        client:clients(nome_razao_social),
        service:services(nome)
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setContractedServices(data || []);
    }
    setLoading(false);
  };

  const updateContractedService = async (id: string, updateData: Database["public"]["Tables"]["client_services"]["Update"]) => {
    const { data, error } = await supabase
      .from("client_services")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      setContractedServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    }
    return { data, error };
  };

  const cancelContract = async (id: string) => {
    return updateContractedService(id, { status: 'cancelado', data_fim: new Date().toISOString() });
  };

  const pauseContract = async (id: string) => {
    return updateContractedService(id, { status: 'pausado' });
  };

  const reactivateContract = async (id: string) => {
    return updateContractedService(id, { status: 'ativo' });
  };

  const generateManualInvoice = async (contractId: string) => {
    const { data, error } = await supabase.rpc("generate_manual_invoice_from_contract" as any, {
      _contract_id: contractId
    });
    return { data, error };
  };

  const createContract = async (contractData: Database["public"]["Tables"]["client_services"]["Insert"]) => {
    const { data, error } = await supabase
      .from("client_services")
      .insert(contractData)
      .select()
      .single();
    
    if (!error) {
      setContractedServices(prev => [data, ...prev]);
    }
    return { data, error };
  };

  useEffect(() => {
    fetchContractedServices();
  }, []);

  return {
    contractedServices,
    loading,
    fetchContractedServices,
    updateContractedService,
    cancelContract,
    pauseContract,
    reactivateContract,
    generateManualInvoice,
    createContract,
  };
}
