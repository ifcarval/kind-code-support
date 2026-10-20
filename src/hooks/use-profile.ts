import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

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

  const pendingStepRef = useRef<string>("session");

  useEffect(() => {
    let mounted = true;

    const timer = window.setTimeout(() => {
      if (!mounted) return;

      console.warn('[Auth] timeout reached at step:', pendingStepRef.current);

      setTimeoutReached(true);
      setSessionLoading(false);
    }, 10000);

    async function loadSession() {
      try {
        pendingStepRef.current = "session";
        setSessionLoading(true);
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setSession(data.session ?? null);

        if (data.session) {
          setUserEmail(data.session.user?.email ?? null);
        }

        setTimeoutReached(false);
      } catch (error: any) {
        console.error('[Auth] session error:', error);

        if (mounted) {
          setSession(null);
          setSessionError(
            error instanceof Error
              ? error.message
              : 'Erro ao carregar sessão'
          );
        }
      } finally {
        clearTimeout(timer);

        if (mounted) {
          setSessionLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUserEmail(newSession?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!userId) return null;
      try {
        pendingStepRef.current = "profile";
        const { data, error } = await supabase
          .from("profiles")
          .select(
            `
            *,
            company:companies(
              id,
              nome
            )
          `
          )
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

  const {
    data: membership,
    isLoading: membershipLoading,
    error: membershipError,
  } = useQuery({
    queryKey: ["organization_members", userId],
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!userId) return null;
      try {
        pendingStepRef.current = "membership";
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

  const isLoading =
    sessionLoading ||
    (!!userId && (profileLoading || membershipLoading));

  const rawRole = (profile?.role || "").toLowerCase();
  const memberRole = (membership?.role || "").toLowerCase();

  const isOwner = rawRole === "owner" || memberRole === "owner";
  const isUser = rawRole === "user" || (!rawRole && !memberRole);

  return {
    session,
    profile,
    membership,
    isLoading,
    profileError,
    membershipError,
    sessionError,
    timeoutReached: timeoutReached && !session && !sessionError,
    pendingStep: pendingStepRef.current,
    refetch,
    isAuthenticated: !!session,
    isMaster: isOwner,
    isCustomer: isUser,
    isCommon: isUser,
    isOwner,
    isUser,
    isLifetimeAdmin: isOwner,
    isVitalicia: false,
    email: userEmail,
  };
}
