import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .order("name");
    
    if (!error) {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const saveTemplate = async (template: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa não encontrada" };

    const templateData = {
      ...template,
      company_id: profile.company_id
    };

    let result;
    if (template.id) {
      result = await supabase
        .from("message_templates")
        .update(templateData)
        .eq("id", template.id);
    } else {
      result = await supabase
        .from("message_templates")
        .insert(templateData);
    }

    if (!result.error) {
      toast({ title: "Template salvo com sucesso!" });
      await fetchTemplates();
    } else {
      toast({ 
        variant: "destructive", 
        title: "Erro ao salvar template", 
        description: result.error.message 
      });
    }
    return result;
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from("message_templates")
      .delete()
      .eq("id", id);
    
    if (!error) {
      toast({ title: "Template excluído" });
      await fetchTemplates();
    }
    return { error };
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    fetchTemplates,
    saveTemplate,
    deleteTemplate
  };
}
