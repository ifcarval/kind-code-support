import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventItem {
  id: string;
  organization_id: string;
  customer_id?: string | null;
  title: string;
  event_type?: string | null;
  status: 'QUOTE' | 'RESERVED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  start_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  guests?: number | null;
  total_value?: number | null;
  signal_value?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: { nome_razao_social: string } | null;
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events" as any)
      .select(`
        *,
        customer:clients(nome_razao_social)
      `)
      .order("start_date", { ascending: true });

    if (!error && data) {
      setEvents(data as unknown as EventItem[]);
    }
    setLoading(false);
  };

  const createEvent = async (eventData: Partial<EventItem>) => {
    const { data, error } = await supabase
      .from("events" as any)
      .insert([eventData])
      .select()
      .single();

    if (!error && data) {
      setEvents(prev => [data as unknown as EventItem, ...prev]);
    }
    return { data, error };
  };

  const updateEvent = async (id: string, eventData: Partial<EventItem>) => {
    const { data, error } = await supabase
      .from("events" as any)
      .update(eventData)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setEvents(prev => prev.map(e => e.id === id ? (data as unknown as EventItem) : e));
    }
    return { data, error };
  };

  const cancelEvent = async (id: string) => {
    return updateEvent(id, { status: 'CANCELLED' });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    cancelEvent
  };
}
