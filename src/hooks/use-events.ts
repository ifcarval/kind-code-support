import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventTypeItem {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

export interface EventItem {
  id: string;
  organization_id: string;
  customer_id?: string | null;
  title: string;
  event_type?: string | null;
  event_type_id?: string | null;
  custom_event_type?: string | null;
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
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventTypes = async () => {
    const { data, error } = await supabase
      .from("event_types" as any)
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setEventTypes(data as unknown as EventTypeItem[]);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    await fetchEventTypes();
    const { data, error } = await supabase
      .from("events" as any)
      .select(`
        *,
        customer:customers(name)
      `)
      .order("start_date", { ascending: true });

    if (!error && data) {
      setEvents(data as unknown as EventItem[]);
    }
    setLoading(false);
  };

  const getOrganizationMembership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { organizationId: null, error: new Error("Usuário não autenticado.") };

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members" as any)
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership || !(membership as any).organization_id) {
      return { organizationId: null, error: membershipError || new Error("Usuário sem organização vinculada.") };
    }

    const orgId = (membership as any).organization_id;
    console.log(
      'organization_id enviado no evento:',
      orgId
    );

    return { organizationId: orgId, error: null };
  };

  const createEvent = async (eventData: Partial<EventItem>) => {
    const { organizationId, error: orgError } = await getOrganizationMembership();
    if (orgError || !organizationId) {
      return { data: null, error: orgError || new Error("Usuário sem organização vinculada.") };
    }

    const eventPayload = {
      ...eventData,
      organization_id: organizationId
    };

    const { data, error } = await supabase
      .from("events" as any)
      .insert([eventPayload])
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
    eventTypes,
    loading,
    fetchEvents,
    fetchEventTypes,
    createEvent,
    updateEvent,
    cancelEvent
  };
}
