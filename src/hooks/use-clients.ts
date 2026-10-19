import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useProfile } from "./use-profile";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Customer = Client;

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useProfile();

  const fetchClients = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("clients")
        .select("*")
        .order("nome_razao_social");

      if (search && search.trim() !== "") {
        const term = search.trim();
        query = query.or(`nome_razao_social.ilike.%${term}%,email.ilike.%${term}%,cpf_cnpj.ilike.%${term}%,telefone.ilike.%${term}%,telefone_secundario.ilike.%${term}%`);
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

  const createClient = async (clientData: any) => {
    try {
      const companyId = profile?.company_id;
      if (!companyId) {
        return { data: null, error: { message: "Empresa não encontrada no perfil do usuário." } };
      }

      const payload = {
        company_id: companyId,
        nome_razao_social: clientData.name || clientData.nome_razao_social,
        cpf_cnpj: clientData.document || clientData.cpf_cnpj,
        email: clientData.email,
        telefone: clientData.phone || clientData.telefone,
        telefone_secundario: clientData.whatsapp || clientData.telefone_secundario,
        endereco: clientData.address || clientData.endereco,
        status: clientData.status || "ativo",
      };

      const { data, error } = await supabase.from("clients").insert(payload).select().single();
      if (!error && data) {
        setClients(prev => [data, ...prev]);
      }
      return { data, error };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Erro ao criar cliente." } };
    }
  };

  const updateClient = async (id: string, clientData: any) => {
    const payload: any = {};
    if (clientData.name !== undefined || clientData.nome_razao_social !== undefined) {
      payload.nome_razao_social = clientData.name || clientData.nome_razao_social;
    }
    if (clientData.document !== undefined || clientData.cpf_cnpj !== undefined) {
      payload.cpf_cnpj = clientData.document || clientData.cpf_cnpj;
    }
    if (clientData.email !== undefined) payload.email = clientData.email;
    if (clientData.phone !== undefined || clientData.telefone !== undefined) {
      payload.telefone = clientData.phone || clientData.telefone;
    }
    if (clientData.whatsapp !== undefined || clientData.telefone_secundario !== undefined) {
      payload.telefone_secundario = clientData.whatsapp || clientData.telefone_secundario;
    }
    if (clientData.address !== undefined || clientData.endereco !== undefined) {
      payload.endereco = clientData.address || clientData.endereco;
    }
    if (clientData.status !== undefined) payload.status = clientData.status;

    const { data, error } = await supabase.from("clients").update(payload).eq("id", id).select().single();
    if (!error && data) {
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
