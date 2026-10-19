import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useProfile } from "./use-profile";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export function useClients() {
  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);
  const { profile, session } = useProfile();

  const getOrganizationId = async (): Promise<string | null> => {
    // 1. Tentar pegar do perfil atual se já carregado
    if (profile?.organization_id) {
      return profile.organization_id;
    }

    // 2. Tentar via sessão atual
    const currentSession = session || (await supabase.auth.getSession()).data.session;
    if (!currentSession?.user?.id) return null;
    const userId = currentSession.user.id;
    const userEmail = (currentSession.user.email || "").toLowerCase();
    const isMasterEmail = userEmail === 'igor.carvalho76@gmail.com' || userEmail === 'igor.felipe76@gmail.com';

    // 3. Consultar profile no banco diretamente se necessário
    const { data: profileData } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileData?.organization_id) {
      return profileData.organization_id;
    }

    // 4. Consultar organization_members
    const { data: memberData } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId);

    if (memberData && memberData.length > 0) {
      return memberData[0].organization_id;
    }

    // 5. Se for master e não houver vínculo explícito, buscar qualquer organização existente ou criar/vincular a do Salão Santa Felicidade
    if (isMaster || profileData?.role === 'master' || profileData?.role === 'super_admin') {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);

      if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;
        // Tentar salvar o vínculo para futuras consultas
        await supabase
          .from("organization_members")
          .upsert({ user_id: userId, organization_id: orgId, role: 'owner' }, { onConflict: 'user_id,organization_id' })
          .select();
        
        await supabase
          .from("profiles")
          .update({ organization_id: orgId })
          .eq('id', userId);

        return orgId;
      }
    }

    return null;
  };

  const fetchClients = async (search?: string) => {
    setLoading(true);
    setOrgLoading(true);
    const orgId = await getOrganizationId();
    setOrgLoading(false);
    
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
      return { data: null, error: { message: "Organização não encontrada para o usuário." } };
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
  }, [profile?.id]);

  return {
    clients,
    loading,
    orgLoading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getOrganizationId,
  };
}
