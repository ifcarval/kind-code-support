import { useProfile } from "./use-profile";

export function usePermissions() {
  const { profile, session, isLoading } = useProfile();

  const rawRole = (profile?.role || "").toLowerCase();
  const isMaster = rawRole === "master" || rawRole === "super_admin" || profile?.company?.subscription_status === "vitalicia";
  const isCommon = !isMaster;

  const canAccessModule = (module: string): boolean => {
    if (!session) return false;
    if (isMaster) return true;

    // Regras para usuário comum (COMMON / comum)
    const allowedModulesForCommon = ["events", "calendar"];
    return allowedModulesForCommon.includes(module.toLowerCase());
  };

  return {
    role: isMaster ? "master" : "common",
    isMaster,
    isCommon,
    canAccessModule,
    isLoading,
  };
}
