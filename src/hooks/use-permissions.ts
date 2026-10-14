import { useProfile } from "./use-profile";

export function usePermissions() {
  const { profile, session, isLoading } = useProfile();

  const rawRole = (profile?.role || "").toLowerCase();
  const isMaster = rawRole === "master" || rawRole === "super_admin" || profile?.company?.subscription_status === "vitalicia";
  const isCustomer = rawRole === "customer";
  const isCommon = !isMaster && !isCustomer;

  const canAccessModule = (module: string): boolean => {
    if (!session) return false;
    if (isMaster) return true;

    if (isCustomer) {
      const allowedForCustomer = ["disponibilidade", "minhas-solicitacoes"];
      return allowedForCustomer.includes(module.toLowerCase());
    }

    // Regras para usuário comum
    const allowedModulesForCommon = ["events", "calendar", "disponibilidade"];
    return allowedModulesForCommon.includes(module.toLowerCase());
  };

  return {
    role: isMaster ? "master" : isCustomer ? "customer" : "common",
    isMaster,
    isCustomer,
    isCommon,
    canAccessModule,
    isLoading,
  };
}
