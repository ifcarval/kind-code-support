import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PublicAvailabilityItem = {
  start_date: string;
  status: "QUOTE" | "RESERVED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

/**
 * Consulta pública mínima de disponibilidade.
 *
 * Esta tela não precisa carregar cliente, valores, observações, horários ou
 * qualquer outro dado operacional do evento. Manter a seleção enxuta reduz a
 * exposição desnecessária de informações no navegador público.
 */
export function usePublicAvailability() {
  const [items, setItems] = useState<PublicAvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAvailability() {
      setLoading(true);

      const { data, error } = await supabase
        .from("events" as any)
        .select("start_date,status")
        .neq("status", "CANCELLED")
        .order("start_date", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error("[PublicAvailability] Falha ao consultar disponibilidade:", error);
        setItems([]);
      } else {
        setItems((data || []) as PublicAvailabilityItem[]);
      }

      setLoading(false);
    }

    loadAvailability();

    return () => {
      mounted = false;
    };
  }, []);

  return { items, loading };
}
