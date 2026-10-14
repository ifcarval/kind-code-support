import { useProfile } from "./use-profile";

export function usePermissions() {
  const { profile, session, isLoading, isMaster, isCustomer, isCommon, timeoutReached, profileError } = useProfile();

  const canAccessModule = (module: string): boolean => {
    if (!session) return false;
    if (isMaster) return true;

    if (isCustomer) {
      const allowedForCustomer = ["disponibilidade", "minhas-solicitacoes"];
      return allowedForCustomer.includes(module.toLowerCase());
    }

    // Regras para usuário comum
    const allowedModulesForCommon = ["events", "calendar", "disponibilidade", "dashboard"];
    return allowedModulesForCommon.includes(module.toLowerCase());
  };

  return {
    role: isMaster ? "master" : isCustomer ? "customer" : "common",
    isMaster,
    isCustomer,
    isCommon,
    canAccessModule,
    isLoading,
    session,
    profile,
    timeoutReached,
    profileError,
  };
}
