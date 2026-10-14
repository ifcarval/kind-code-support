import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Receipt, 
  Briefcase,
  ChevronLeft, 
  ChevronRight,
  Bell
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, session, isLoading: profileLoading } = useProfile();
  const { isMaster, canAccessModule } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!profileLoading && !session) {
      navigate({ to: "/login" });
    }
  }, [session, profileLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && session) {
      const currentPath = location.pathname.replace("/", "") || "agendamentos";
      const moduleKey = currentPath.split("/")[0] || "agendamentos";
      const routeMap: Record<string, string> = {
        "": "agendamentos",
        "agendamentos": "agendamentos",
        "events": "events",
        "calendar": "calendar",
        "clients": "clients",
        "billing": "billing",
        "contracts": "contracts",
        "landlords": "landlords",
        "settings": "settings"
      };
      const resolvedModule = routeMap[moduleKey] || moduleKey;
      if (!canAccessModule(resolvedModule)) {
        navigate({ to: "/agendamentos" });
      }
    }
  }, [location.pathname, isMaster, session, profileLoading, canAccessModule, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const allNavItems = [
    { label: "Agendamentos", icon: LayoutDashboard, to: "/agendamentos", module: "agendamentos" },
    { label: "Eventos", icon: Briefcase, to: "/events", module: "events" },
    { label: "Calendário", icon: LayoutDashboard, to: "/calendar", module: "calendar" },
    { label: "Clientes", icon: Users, to: "/clients", module: "clients" },
    { label: "Financeiro", icon: Receipt, to: "/billing", module: "billing" },
    { label: "Contratos", icon: Briefcase, to: "/contracts", module: "contracts" },
    { label: "Locadores", icon: Users, to: "/landlords", module: "landlords" },
    { label: "Configurações", icon: Settings, to: "/settings", module: "settings" },
  ];

  const navItems = allNavItems.filter(item => canAccessModule(item.module));

  const getPageTitle = () => {
    const current = navItems.find(item => item.to === location.pathname);
    return current ? current.label : "Sistema";
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={cn(
        "border-r bg-card transition-all duration-300 hidden md:flex flex-col sticky top-0 h-screen",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("p-6 border-b flex items-center shrink-0", isSidebarCollapsed ? "justify-center" : "justify-between")}>
          {!isSidebarCollapsed && <h1 className="text-xl font-bold truncate">Salão Santa Felicidade</h1>}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-8 w-8"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Button 
              key={item.to}
              variant={location.pathname === item.to ? "secondary" : "ghost"} 
              className={cn(
                "w-full justify-start gap-2", 
                isSidebarCollapsed && "justify-center px-0",
                location.pathname === item.to && "bg-secondary"
              )} 
              onClick={() => navigate({ to: item.to as any })}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>
        <div className="p-4 border-t shrink-0">
          <Button variant="ghost" className={cn("w-full justify-start gap-2 text-destructive", isSidebarCollapsed && "justify-center px-0")} onClick={handleSignOut}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0 sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold truncate leading-tight">{getPageTitle()}</h2>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                {profile?.nome || profile?.email || "Usuário"}
              </span>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block w-fit",
                isMaster ? "bg-primary/10 text-primary border border-primary/25" : "bg-muted text-muted-foreground border"
              )}>
                {isMaster ? "MASTER" : "USUÁRIO COMUM"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-medium">{profile?.nome?.[0]?.toUpperCase() || "U"}</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}