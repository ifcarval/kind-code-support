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
    }, 12000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setSessionLoading(false);
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
    retry: 2,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const userId = session.user.id;
      const userEmail = (session.user.email || "").toLowerCase();
      const isMasterEmail = userEmail === 'igor.carvalho76@gmail.com' || userEmail === 'igor.felipe76@gmail.com';
      
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error('PROFILE FETCH ERROR:', error.message, error.code);
      }

      if (!data) {
        const defaultRole = isMasterEmail ? 'master' : 'customer';
        const newProfile = {
          id: userId,
          email: userEmail,
          nome: session.user.user_metadata?.full_name || session.user.user_metadata?.nome || (isMasterEmail ? 'Igor Carvalho' : 'Usuário'),
          role: defaultRole
        };
        
        const { error: upsertErr } = await supabase.from("profiles").upsert(newProfile);
        if (upsertErr) {
          console.error('PROFILE UPSERT ERROR:', upsertErr.message);
        }
        data = newProfile;
      } else if (isMasterEmail && data.role !== 'master') {
        await supabase.from("profiles").update({ role: 'master' }).eq('id', userId);
        data.role = 'master';
      }

      return data;
    },
  });

  const isLoading = sessionLoading || (!!session?.user?.id && profileLoading && !timeoutReached && !profile && !profileError);

  const rawRole = (profile?.role || "").toLowerCase();
  const isMaster = rawRole === "master" || rawRole === "super_admin" || (session?.user?.email || '').toLowerCase() === 'igor.carvalho76@gmail.com';
  const isCustomer = rawRole === "customer" && !isMaster;
  const isCommon = !isMaster && !isCustomer;

  const isLifetimeAdmin = session?.user?.email === 'igor.felipe76@gmail.com' || profile?.company?.subscription_status === 'vitalicia';
  const isVitalicia = profile?.company?.subscription_status === 'vitalicia';

  return {
    session,
    profile,
    isLoading,
    profileError,
    timeoutReached: timeoutReached && !profile && !profileError,
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