import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";

export interface LandlordItem {
  id: string;
  organization_id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  pix_key?: string | null;
  bank_details?: any;
  notes?: string | null;
}

export function useLandlords() {
  const [landlords, setLandlords] = useState<LandlordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  const fetchLandlords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("landlords" as any)
      .select("*")
      .order("name");

    if (!error && data) {
      setLandlords(data as unknown as LandlordItem[]);
    }
    setLoading(false);
  };

  const createLandlord = async (item: Partial<LandlordItem>) => {
    const orgId = profile?.organization_id || (await supabase.auth.getSession()).data.session?.user.id;
    const { data, error } = await supabase
      .from("landlords" as any)
      .insert([{ ...item, organization_id: profile?.organization_id || orgId }])
      .select()
      .single();

    if (!error && data) {
      setLandlords(prev => [...prev, data as unknown as LandlordItem]);
    }
    return { data, error };
  };

  const updateLandlord = async (id: string, item: Partial<LandlordItem>) => {
    const { data, error } = await supabase
      .from("landlords" as any)
      .update(item)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setLandlords(prev => prev.map(l => l.id === id ? (data as unknown as LandlordItem) : l));
    }
    return { data, error };
  };

  const deleteLandlord = async (id: string) => {
    const { error } = await supabase.from("landlords" as any).delete().eq("id", id);
    if (!error) {
      setLandlords(prev => prev.filter(l => l.id !== id));
    }
    return { error };
  };

  useEffect(() => {
    fetchLandlords();
  }, []);

  return {
    landlords,
    loading,
    fetchLandlords,
    createLandlord,
    updateLandlord,
    deleteLandlord
  };
}
