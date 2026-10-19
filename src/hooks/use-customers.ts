import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerItem {
  id: string;
  nome_razao_social: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, nome_razao_social, email, telefone, cpf_cnpj")
      .order("nome_razao_social");

    if (!error && data) {
      setCustomers(data as unknown as CustomerItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, loading, fetchCustomers };
}