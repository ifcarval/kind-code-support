import { useProfile } from "./use-profile";

export function usePermissions() {
  const { profile, session, isLoading, isMaster, isCustomer, isCommon, timeoutReached, profileError } = useProfile();

  const canAccessModule = (module: string): boolean => {
    if (!session) return false;
    if (isMaster) return true;

    if (isCustomer || isCommon) {
      const allowedForCustomer = ["meus-contratos"];
      return allowedForCustomer.includes(module.toLowerCase());
    }

    return false;
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
