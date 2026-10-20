import { useProfile } from "./use-profile";

export function usePermissions() {
  const { profile, session, isLoading, isOwner, isUser, timeoutReached, profileError } = useProfile();

  const canAccessModule = (module: string): boolean => {
    if (!session) return false;
    if (isOwner) return true;

    if (isUser) {
      const allowedForUser = ["meus-contratos"];
      return allowedForUser.includes(module.toLowerCase());
    }

    return false;
  };

  return {
    role: isOwner ? "owner" : "user",
    isMaster: isOwner,
    isCustomer: isUser,
    isCommon: isUser,
    canAccessModule,
    isLoading,
    session,
    profile,
    timeoutReached,
    profileError,
  };
}
