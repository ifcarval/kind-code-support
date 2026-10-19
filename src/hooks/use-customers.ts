import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerItem {
  id: string;
  name: string;
  nome_razao_social?: string;
  email?: string;
  phone?: string;
  telefone?: string;
  document?: string;
  cpf_cnpj?: string;
  status?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers" as any)
      .select("id, name, email, phone, document, status")
      .order("name");

    if (!error && data) {
      const mapped = (data as any[]).map(c => ({
        ...c,
        nome_razao_social: c.name,
        telefone: c.phone,
        cpf_cnpj: c.document
      }));
      setCustomers(mapped as CustomerItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, loading, fetchCustomers };
}