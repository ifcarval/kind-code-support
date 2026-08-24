import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Service = Database["public"]["Tables"]["services"]["Row"];

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("nome");

    if (!error) {
      setServices(data || []);
    }
    setLoading(false);
  };

  const createService = async (serviceData: Database["public"]["Tables"]["services"]["Insert"]) => {
    const { data, error } = await supabase.from("services").insert(serviceData).select().single();
    if (!error) {
      setServices(prev => [...prev, data]);
    }
    return { data, error };
  };

  const updateService = async (id: string, serviceData: Database["public"]["Tables"]["services"]["Update"]) => {
    const { data, error } = await supabase.from("services").update(serviceData).eq("id", id).select().single();
    if (!error) {
      setServices(prev => prev.map(s => s.id === id ? data : s));
    }
    return { data, error };
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    fetchServices,
    createService,
    updateService,
  };
}
