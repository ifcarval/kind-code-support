import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useProfile } from "./use-profile";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export function useClients() {
  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [orgLoading, setOrgLoading] = useState<boolean>(true);
  const [orgReady, setOrgReady] = useState<boolean>(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const { profile, session, isMaster } = useProfile();

  const getOrganizationId = useCallback(async (): Promise<string | null> => {
    try {
      // 1. Tentar pegar do perfil atual do operador logado
      if (profile?.organization_id) {
        return profile.organization_id;
      }

      const currentSession = session || (await supabase.auth.getSession()).data.session;
      if (!currentSession?.user?.id) {
        throw new Error("Usuário não autenticado.");
      }
      const userId = currentSession.user.id;
      const userEmail = (currentSession.user.email || "").toLowerCase();
      const isMasterUser = isMaster || userEmail === 'igor.carvalho76@gmail.com' || userEmail === 'igor.felipe76@gmail.com';

      // 2. Consultar profile do operador
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("organization_id, role")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr) {
        console.error("[useClients] Erro ao buscar profile:", profileErr.message);
      } else if (profileData?.organization_id) {
        return profileData.organization_id;
      }

      // 3. Consultar organization_members do operador
      const { data: memberData, error: memberErr } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", userId);

      if (memberErr) {
        console.error("[useClients] Erro ao buscar organization_members:", memberErr.message);
      }

      if (memberData && memberData.length > 0) {
        const preferred = memberData.find(m => m.role === 'owner' || m.role === 'admin') || memberData[0];
        return preferred.organization_id;
      }

      // 4. Se for master e não houver vínculo explícito, buscar organização padrão existente
      if (isMasterUser) {
        const { data: orgs, error: orgsErr } = await supabase
          .from("organizations")
          .select("id")
          .limit(1);

        if (!orgsErr && orgs && orgs.length > 0) {
          const orgId = orgs[0].id;
          await supabase
            .from("organization_members")
            .upsert({ user_id: userId, organization_id: orgId, role: 'owner' }, { onConflict: 'user_id,organization_id' });
          
          await supabase
            .from("profiles")
            .update({ organization_id: orgId })
            .eq('id', userId);

          return orgId;
        }
      }

      throw new Error("Seu usuário operador não está vinculado a uma organização.");
    } catch (err: any) {
      console.error("[useClients] getOrganizationId error:", err?.message || err);
      throw err;
    }
  }, [profile?.organization_id, session, isMaster]);

  const fetchClients = useCallback(async (search?: string) => {
    setOrgLoading(true);
    setOrgReady(false);
    setOrgError(null);
    setLoading(true);

    const timeoutId = setTimeout(() => {
      setOrgLoading(false);
      setOrgError("O tempo limite de conexão excedeu ao tentar carregar a organização.");
      setLoading(false);
    }, 8000);

    try {
      const orgId = await getOrganizationId();
      clearTimeout(timeoutId);

      if (!orgId) {
        setOrgError("Seu usuário não está vinculado a uma organização.");
        setOrgLoading(false);
        setOrgReady(false);
        setLoading(false);
        setClients([]);
        return;
      }

      setOrgReady(true);
      setOrgLoading(false);

      let query = supabase
        .from("customers")
        .select("*")
        .eq("organization_id", orgId)
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
      clearTimeout(timeoutId);
      console.error("[useClients] Falha na inicialização:", err);
      setOrgError(err?.message || "Não foi possível carregar a organização.");
      setOrgReady(false);
      setClients([]);
    } finally {
      setOrgLoading(false);
      setLoading(false);
    }
  }, [getOrganizationId]);

  const createClient = async (clientData: Omit<Database["public"]["Tables"]["customers"]["Insert"], "organization_id">) => {
    try {
      // Obter EXCLUSIVAMENTE a organização do OPERADOR autenticado
      const orgId = await getOrganizationId();
      if (!orgId) {
        return { data: null, error: { message: "Organização do operador não encontrada." } };
      }

      // Inserir APENAS o registro do cliente na tabela customers, sem criar login, profiles ou organization_members para o cliente
      const payload = {
        ...clientData,
        organization_id: orgId,
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
    orgLoading,
    orgReady,
    orgError,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getOrganizationId,
  };
}
