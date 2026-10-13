import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useProfile } from "./use-profile";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export function useClients() {
  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  const getOrganizationId = async () => {
    if (profile?.organization_id) return profile.organization_id;
    
    // Fallback: fetch user's organization member record
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", session.user.id)
      .single();

    return member?.organization_id || null;
  };

  const fetchClients = async (search?: string) => {
    setLoading(true);
    const orgId = await getOrganizationId();
    
    let query = supabase.from("customers").select("*").order("name");

    if (orgId) {
      query = query.eq("organization_id", orgId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,document.ilike.%${search}%,phone.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (!error) {
      setClients(data || []);
    }
    setLoading(false);
  };

  const createClient = async (clientData: Omit<Database["public"]["Tables"]["customers"]["Insert"], "organization_id">) => {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return { data: null, error: { message: "Organização não encontrada para o usuário" } };
    }

    const payload = {
      ...clientData,
      organization_id: orgId,
    };

    const { data, error } = await supabase.from("customers").insert(payload).select().single();
    if (!error && data) {
      setClients(prev => [...prev, data]);
    }
    return { data, error };
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
