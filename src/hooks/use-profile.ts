import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "@tanstack/react-router";

export function useProfile() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const timer = setTimeout(() => {
      if (isMounted) {
        console.warn("[Auth Timeout] Session/Profile load timeout reached");
        setTimeoutReached(true);
        setSessionLoading(false);
      }
    }, 8000);

    async function loadSession() {
      try {
        setSessionLoading(true);
        console.log("[AuthDiag] getSession called");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthDiag] getSession error:", error.message);
          setSessionError(error.message);
          // Se houver erro de token inválido ou sessão antiga, limpa o storage do projeto atual
          if (error.message.includes("Invalid Refresh Token") || error.message.includes("JWT") || error.message.includes("token")) {
            console.warn("[AuthDiag] Invalid session token detected from old project. Cleaning session.");
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && (key.includes("supabase.auth.token") || key.includes("sb-"))) {
                localStorage.removeItem(key);
              }
            }
            await supabase.auth.signOut().catch(() => {});
          }
          if (isMounted) {
            setSession(null);
          }
        } else if (data?.session) {
          console.log("[AuthDiag] session found, userId:", data.session.user?.id);
          if (isMounted) {
            setSession(data.session);
            setUserEmail(data.session.user?.email || null);
          }
        } else {
          console.log("[AuthDiag] no session returned");
          if (isMounted) {
            setSession(null);
          }
        }
      } catch (err: any) {
        console.error("[AuthDiag] session exception:", err?.message);
        if (isMounted) {
          setSessionError(err?.message);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setSessionLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log("[AuthDiag] onAuthStateChange event:", _event);
      if (isMounted) {
        setSession(currentSession);
        setUserEmail(currentSession?.user?.email || null);
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
    retry: 1,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const userId = session.user.id;
      const emailVal = (session.user.email || "").toLowerCase();
      const isMasterEmail = emailVal === 'igor.carvalho76@gmail.com' || emailVal === 'igor.felipe76@gmail.com';
      
      console.log("[AuthDiag] querying profile for userId:", userId);
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AuthDiag] profile query error:", error.message);
      }

      if (!data) {
        console.log("[AuthDiag] profile not found, checking master privileges");
        const defaultRole = isMasterEmail ? 'master' : 'customer';
        const newProfile = {
          id: userId,
          email: emailVal,
          nome: session.user.user_metadata?.full_name || session.user.user_metadata?.nome || (isMasterEmail ? 'Igor Carvalho' : 'Usuário'),
          role: defaultRole
        };
        
        const { error: upsertErr } = await supabase.from("profiles").upsert(newProfile);
        if (!upsertErr) {
          data = newProfile;
        }
      } else if (isMasterEmail && data.role !== 'master') {
        await supabase.from("profiles").update({ role: 'master' }).eq('id', userId);
        data.role = 'master';
      }

      console.log("[AuthDiag] profile found:", !!data);
      return data || { id: userId, email: emailVal, role: isMasterEmail ? 'master' : 'customer', nome: 'Usuário' };
    },
  });

  const isLoading = sessionLoading || (!!session?.user?.id && profileLoading && !timeoutReached && !profile && !profileError);

  const rawRole = (profile?.role || "").toLowerCase();
  const isMaster = userEmail === 'igor.carvalho76@gmail.com' || rawRole === "master" || rawRole === "super_admin" || (session?.user?.email || '').toLowerCase() === 'igor.carvalho76@gmail.com';
  const isCustomer = rawRole === "customer" && !isMaster;
  const isCommon = !isMaster && !isCustomer;

  return {
    session,
    profile,
    isLoading,
    profileError,
    sessionError,
    timeoutReached: timeoutReached && !profile && !profileError,
    refetch,
    isAuthenticated: !!session,
    isMaster,
    isCustomer,
    isCommon,
  };
}