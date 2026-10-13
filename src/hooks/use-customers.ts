import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers" as any)
      .select("*")
      .order("name");

    if (!error && data) {
      setCustomers(data as unknown as CustomerItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, loading, fetchCustomers };
}