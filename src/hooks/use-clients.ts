import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useProfile } from "./use-profile";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export function useClients() {
  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { isMaster } = useProfile();

  const fetchClients = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("customers")
        .select("*")
        .order("name");

      if (search && search.trim() !== "") {
        const term = search.trim();
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,document.ilike.%${term}%,phone.ilike.%${term}%,whatsapp.ilike.%${term}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[useClients] Erro ao buscar clientes:", error.message);
        setClients([]);
      } else {
        setClients(data || []);
      }
    } catch (err: any) {
      console.error("[useClients] Falha ao buscar clientes:", err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (clientData: Omit<Database["public"]["Tables"]["customers"]["Insert"], "organization_id">) => {
    try {
      const payload = {
        ...clientData,
      };

      const { data, error } = await supabase.from("customers").insert(payload).select().single();
      if (!error && data) {
        setClients(prev => [data, ...prev]);
      }
      return { data, error };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Erro ao criar cliente." } };
    }
  };

  const updateClient = async (id: string, clientData: Database["public"]["Tables"]["customers"]["Update"]) => {
    const { data, error } = await supabase.from("customers").update(clientData).eq("id", id).select().single();
    if (!error && data) {
      setClients(prev => prev.map(c => c.id === id ? data : c));
    }
    return { data, error };
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
    return { error };
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    orgLoading: false,
    orgReady: true,
    orgError: null,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}
