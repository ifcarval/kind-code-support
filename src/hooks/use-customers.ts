import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerItem {
  id: string;
  organization_id?: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers" as any)
        .select("id, organization_id, name, document, email, phone, user_id, created_at, updated_at")
        .order("name");

      if (!error && data) {
        setCustomers(data as CustomerItem[]);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Erro ao buscar customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = async (formData: { name: string; document?: string; email?: string; phone?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: "Usuário não autenticado." } };
      }

      const { data: membership, error: membershipError } = await supabase
        .from("organization_members" as any)
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (membershipError || !membership || !(membership as any).organization_id) {
        return { data: null, error: { message: "Organização atual não encontrada para o usuário." } };
      }

      const organizationId = (membership as any).organization_id;

      if (!formData.name || !formData.name.trim()) {
        return { data: null, error: { message: "O campo Nome é obrigatório." } };
      }

      const payload = {
        organization_id: organizationId,
        name: formData.name.trim(),
        document: formData.document?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        user_id: null
      };

      const { data, error } = await supabase
        .from("customers" as any)
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        setCustomers(prev => [data as CustomerItem, ...prev]);
      }
      return { data, error };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Erro ao criar cliente." } };
    }
  };

  const updateCustomer = async (id: string, formData: { name?: string; document?: string; email?: string; phone?: string }) => {
    try {
      const payload: any = {};
      if (formData.name !== undefined) payload.name = formData.name.trim();
      if (formData.document !== undefined) payload.document = formData.document?.trim() || null;
      if (formData.email !== undefined) payload.email = formData.email?.trim() || null;
      if (formData.phone !== undefined) payload.phone = formData.phone?.trim() || null;

      const { data, error } = await supabase
        .from("customers" as any)
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        setCustomers(prev => prev.map(c => c.id === id ? (data as CustomerItem) : c));
      }
      return { data, error };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Erro ao atualizar cliente." } };
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customers" as any)
        .delete()
        .eq("id", id);

      if (!error) {
        setCustomers(prev => prev.filter(c => c.id !== id));
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer };
}
