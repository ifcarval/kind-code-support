import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Client = Database["public"]["Tables"]["clients"]["Row"];

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async (search?: string) => {
    setLoading(true);
    let query = supabase.from("clients").select("*").order("nome_razao_social");

    if (search) {
      query = query.or(`nome_razao_social.ilike.%${search}%,email.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,telefone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (!error) {
      setClients(data || []);
    }
    setLoading(false);
  };

  const createClient = async (clientData: Database["public"]["Tables"]["clients"]["Insert"]) => {
    const { data, error } = await supabase.from("clients").insert(clientData).select().single();
    if (!error) {
      setClients(prev => [...prev, data]);
    }
    return { data, error };
  };

  const updateClient = async (id: string, clientData: Database["public"]["Tables"]["clients"]["Update"]) => {
    const { data, error } = await supabase.from("clients").update(clientData).eq("id", id).select().single();
    if (!error) {
      setClients(prev => prev.map(c => c.id === id ? data : c));
    }
    return { data, error };
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
    return { error };
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}
