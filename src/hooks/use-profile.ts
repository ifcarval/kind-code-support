import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useProfile() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const timer = setTimeout(() => {
      if (isMounted) {
        console.warn("[Auth Timeout] Session/Profile load timeout reached");
        setTimeoutReached(true);
        setSessionLoading(false);
      }
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setSessionLoading(false);
        console.log('SESSION OK', session ? 'Authenticated' : 'No session');
      }
    }).catch((err) => {
      console.error('SESSION ERROR:', err);
      if (isMounted) {
        setSessionLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setSessionLoading(false);
        console.log('AUTH STATE CHANGE OK', session ? 'Authenticated' : 'No session');
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useQuery({
    queryKey: ["profile", session?.user?.id],
    enabled: !!session?.user?.id,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      console.log('FETCHING PROFILE FOR:', session.user.id);
      const isMasterEmail = session.user.email?.toLowerCase() === 'igor.carvalho76@gmail.com';
      
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.warn('PROFILE FETCH WARNING:', error.message);
      }

      if (!data) {
        console.warn('PROFILE NOT FOUND, creating default profile...');
        const newProfile = {
          id: session.user.id,
          email: session.user.email || '',
          nome: session.user.user_metadata?.full_name || session.user.user_metadata?.nome || (isMasterEmail ? 'Igor Carvalho' : 'Usuário'),
          role: isMasterEmail ? 'master' : 'customer'
        };
        const { error: upsertErr } = await supabase.from("profiles").upsert(newProfile);
        if (upsertErr) {
          console.error('PROFILE UPSERT ERROR:', upsertErr);
        }
        data = newProfile;
      } else if (isMasterEmail && data.role !== 'master') {
        await supabase.from("profiles").update({ role: 'master' }).eq('id', session.user.id);
        data.role = 'master';
      }

      console.log('PROFILE OK');
      return data;
    },
  });

  const isLoading = sessionLoading || (!!session?.user?.id && profileLoading && !timeoutReached);

  const rawRole = (profile?.role || "").toLowerCase();
  const isMaster = rawRole === "master" || rawRole === "super_admin" || profile?.company?.subscription_status === "vitalicia";
  const isCustomer = rawRole === "customer";
  const isCommon = !isMaster && !isCustomer;

  const isLifetimeAdmin = session?.user?.email === 'igor.felipe76@gmail.com' || profile?.company?.subscription_status === 'vitalicia';
  const isVitalicia = profile?.company?.subscription_status === 'vitalicia';

  return {
    session,
    profile,
    isLoading,
    profileError,
    timeoutReached,
    refetch,
    isAuthenticated: !!session,
    isOwner: profile?.role === 'owner',
    isUser: profile?.role === 'user',
    isLifetimeAdmin,
    isVitalicia,
    isMaster,
    isCustomer,
    isCommon,
  };
}