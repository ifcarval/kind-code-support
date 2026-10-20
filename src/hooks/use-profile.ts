import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type AppProfile = {
  id: string;
  email: string;
  nome: string;
  role: string | null;
  company_id: string | null;
  organization_id: string | null;
  avatar_url: string | null;
  cargo: string | null;
  created_at: string | null;
  empresa: string | null;
  telefone: string | null;
  updated_at: string | null;
  company?: {
    id: string;
    name: string | null;
    trial_ends_at: string | null;
    subscription_status: string | null;
  } | null;
};

type OrganizationMember = {
  organization_id: string;
  role: string;
};

export function useProfile() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [pendingStep, setPendingStep] = useState<string>("session");

  useEffect(() => {
    let isMounted = true;
    
    const timer = setTimeout(() => {
      if (isMounted) {
        console.warn("[Auth] timeout reached at step:", pendingStep);
        setTimeoutReached(true);
        setSessionLoading(false);
      }
    }, 10000);

    async function loadSession() {
      try {
        setPendingStep("session");
        setSessionLoading(true);
        console.log("[Auth] session loaded");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth] session error:", error.message);
          setSessionError(error.message);
          if (error.message.includes("Invalid Refresh Token") || error.message.includes("JWT") || error.message.includes("token")) {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && (key.includes("supabase.auth.token") || key.includes("sb-"))) {
                localStorage.removeItem(key);
              }
            }
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          }
          if (isMounted) {
            setSession(null);
          }
        } else if (data?.session) {
          if (isMounted) {
            setSession(data.session);
            setUserEmail(data.session.user?.email || null);
          }
        } else {
          if (isMounted) {
            setSession(null);
          }
        }
      } catch (err: any) {
        console.error("[Auth] session exception:", err?.message);
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

  const userId = session?.user?.id;

  const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!userId) return null;
      const emailVal = (session?.user?.email || "").toLowerCase();
      const isMasterEmail = emailVal === 'igor.carvalho76@gmail.com' || emailVal === 'igor.felipe76@gmail.com';
      
      try {
        setPendingStep("profile");
        let { data, error } = await supabase
          .from("profiles")
          .select("*, company:companies(id, name, trial_ends_at, subscription_status)")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("[Auth] profile error:", error.message);
        }

        const profileData = data as unknown as AppProfile | null;

        const buildFallback = (): AppProfile => ({
          id: userId,
          email: emailVal,
          nome: session?.user?.user_metadata?.nome || session?.user?.user_metadata?.full_name || (isMasterEmail ? 'Igor Carvalho' : 'Usuário'),
          role: isMasterEmail ? 'master' : 'customer',
          company_id: null,
          organization_id: null,
          avatar_url: null,
          cargo: null,
          created_at: null,
          empresa: null,
          telefone: null,
          updated_at: null,
          company: null,
        });

        if (!profileData) {
          const defaultRole = isMasterEmail ? 'master' : 'customer';
          const newProfile: AppProfile = {
            ...buildFallback(),
            role: defaultRole,
          };

          const { error: upsertErr } = await supabase.from("profiles").upsert(newProfile as never);
          if (!upsertErr) {
            console.log("[Auth] profile loaded");
            return newProfile;
          }
        } else if (isMasterEmail && profileData.role !== 'master') {
          await supabase.from("profiles").update({ role: 'master' as never }).eq('id', userId);
          profileData.role = 'master';
        }

        console.log("[Auth] profile loaded");
        const fallback = buildFallback();
        return profileData || fallback;
      } catch (err: any) {
        console.error("[Auth] profile error exception:", err?.message);
        throw err;
      } finally {
        // garante finalização
      }
    },
  });

  const { data: membership, isLoading: membershipLoading, error: membershipError } = useQuery({
    queryKey: ["organization_members", userId],
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!userId) return null;
      try {
        setPendingStep("membership");
        const { data, error } = await supabase
          .from("organization_members" as any)
          .select("organization_id, role")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("[Auth] membership error:", error.message);
        }
        console.log("[Auth] membership loaded");
        return data as unknown as OrganizationMember | null;
      } catch (err: any) {
        console.error("[Auth] membership error exception:", err?.message);
        return null;
      } finally {
        // garante finalização
      }
    },
  });

  const { data: lifetimeAdmin } = useQuery({
    queryKey: ["lifetime-admin", userId],
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!userId) return false;
      try {
        const { data: ok } = await supabase.rpc("is_lifetime_admin", { _user_id: userId });
        return !!ok;
      } catch {
        return false;
      }
    },
  });

  const isLoading = sessionLoading || (!!userId && (profileLoading || membershipLoading) && !timeoutReached && !profile);

  const rawRole = (profile?.role || "").toLowerCase();
  const isMaster = userEmail === 'igor.carvalho76@gmail.com' || rawRole === "master" || rawRole === "super_admin";
  const isCustomer = rawRole === "customer" && !isMaster;
  const isCommon = !isMaster && !isCustomer;

  return {
    session,
    profile,
    membership,
    isLoading,
    profileError,
    membershipError,
    sessionError,
    timeoutReached: timeoutReached && !profile && !profileError,
    pendingStep,
    refetch,
    isAuthenticated: !!session,
    isMaster,
    isCustomer,
    isCommon,
    isOwner: isMaster || rawRole === "owner" || membership?.role === "owner",
    isUser: rawRole === "user",
    isLifetimeAdmin: lifetimeAdmin === true,
    isVitalicia: profile?.company?.subscription_status === 'vitalicia',
  };
}