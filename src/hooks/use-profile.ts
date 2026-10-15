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
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          company:companies(*)
        `)
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error('PROFILE ERROR:', error);
        throw error;
      }

      if (!data) {
        console.warn('PROFILE NOT FOUND, creating default profile...');
        const isMasterEmail = session.user.email === 'igor.carvalho76@gmail.com';
        const newProfile = {
          id: session.user.id,
          email: session.user.email || '',
          nome: session.user.user_metadata?.full_name || session.user.user_metadata?.nome || (isMasterEmail ? 'Igor Carvalho' : 'Usuário'),
          role: isMasterEmail ? 'master' : 'customer'
        };
        await supabase.from("profiles").upsert(newProfile);
        
        // Se for o master, garantir organization_members owner
        if (isMasterEmail) {
          const { data: org } = await supabase.from('organizations').select('id').ilike('name', '%Santa Felicidade%').maybeSingle();
          if (org) {
            await supabase.from('organization_members').upsert({
              organization_id: org.id,
              user_id: session.user.id,
              role: 'owner'
            }, { onConflict: 'organization_id,user_id' });
          }
        }

        console.log('PROFILE OK (created default)');
        return newProfile;
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