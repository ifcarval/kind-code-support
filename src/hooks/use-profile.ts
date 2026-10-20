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
    nome: string | null;
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
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth] session error:", error.message);
          setSessionError(error.message);
          if (isMounted) {
            setSession(null);
          }
        } else if (data?.session) {
          console.log("[Auth] session loaded successfully");
          if (isMounted) {
            setSession(data.session);
            setUserEmail(data.session.user?.email || null);
          }
        } else {
          console.log("[Auth] no active session found");
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
      try {
        setPendingStep("profile");
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            *,
            company:companies(
              id,
              nome
            )
          `)
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("[Auth] profile error:", error.message);
          throw error;
        }

        if (!data) {
          throw new Error("Perfil não encontrado.");
        }

        console.log("[Auth] profile loaded");
        return data as unknown as AppProfile;
      } catch (err: any) {
        console.error("[Auth] profile error exception:", err?.message);
        throw err;
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
      }
    },
  });

  const isLoading = sessionLoading || (!!userId && (profileLoading || membershipLoading) && !timeoutReached && !profile);

  const rawRole = (profile?.role || "").toLowerCase();
  const memberRole = (membership?.role || "").toLowerCase();

  const isOwner = rawRole === "owner" || memberRole === "owner";
  const isUser = rawRole === "user";

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
    isMaster: isOwner,
    isCustomer: isUser,
    isCommon: isUser,
    isOwner,
    isUser,
    isLifetimeAdmin: isOwner,
    isVitalicia: false,
  };
}