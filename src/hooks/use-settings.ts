import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface CompanySettings {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  due_day_default: number;
  currency: string;
  date_format: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
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
        .select("id, full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch Company
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("company_id")
        .eq("user_id", session.user.id)
        .single();

      if (userRole?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("id, name, cnpj, address, due_day_default, currency, date_format")
          .eq("id", userRole.company_id)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData as CompanySettings);
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
        .update(updates)
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
        .update(updates)
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
