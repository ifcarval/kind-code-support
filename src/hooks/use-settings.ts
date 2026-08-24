import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];

export interface CompanySettings {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  due_day_default?: number;
  currency?: string;
  date_format?: string;
  auto_reminders_enabled?: boolean;
  whatsapp_enabled?: boolean;
}

export interface UserProfile {
  id: string;
  nome: string;
  avatar_url: string | null;
}

export function useSettings() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, nome, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      // Fetch Company via company_id from profile
      const { data: fullProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();

      if (fullProfile?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", fullProfile.company_id)
          .single();

        if (companyError) throw companyError;
        
        // Cast using 'any' for the new columns since they might not be in types.ts yet
        const rawCompany = companyData as any;
        setCompany({
          id: rawCompany.id,
          nome: rawCompany.nome,
          cnpj: rawCompany.cnpj,
          endereco: rawCompany.endereco,
          due_day_default: rawCompany.due_day_default || 10,
          currency: rawCompany.currency || 'BRL',
          date_format: rawCompany.date_format || 'DD/MM/YYYY',
          auto_reminders_enabled: rawCompany.auto_reminders_enabled || false,
          whatsapp_enabled: rawCompany.whatsapp_enabled || false
        });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("id", session.user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: "Perfil atualizado com sucesso" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: error.message,
      });
    }
  };

  const updateCompany = async (updates: Partial<CompanySettings>) => {
    try {
      if (!company?.id) return;

      const { error } = await supabase
        .from("companies")
        .update(updates as any)
        .eq("id", company.id);

      if (error) throw error;
      
      setCompany(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: "Configurações da empresa atualizadas" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar empresa",
        description: error.message,
      });
    }
  };

  return {
    company,
    profile,
    loading,
    updateProfile,
    updateCompany,
    refresh: fetchData
  };
}
