import React, { useState, useEffect, useRef } from "react";
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
  Calendar as CalendarIcon,
  FileText,
  Bell,
  ChevronDown,
  User as UserIcon,
  Shield
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, session, isLoading: profileLoading } = useProfile();
  const { isMaster, isCustomer, canAccessModule } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileLoading && !session) {
      navigate({ to: "/login", replace: true });
    }
  }, [session, profileLoading, navigate]);

  // Fechar menu ao clicar fora ou pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local'
      });

      if (error) {
        throw error;
      }

      setUserMenuOpen(false);
      navigate({ to: "/login", replace: true });
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error("Não foi possível sair da conta. Tente novamente.");
      setIsSigningOut(false);
    }
  };

  const allNavItems = [
    { label: "Meus contratos", icon: FileText, to: "/meus-contratos", module: "meus-contratos" },
    { label: "Agendamentos", icon: LayoutDashboard, to: "/agendamentos", module: "agendamentos" },
    { label: "Disponibilidade", icon: CalendarIcon, to: "/disponibilidade", module: "disponibilidade" },
    { label: "Minhas solicitações", icon: FileText, to: "/minhas-solicitacoes", module: "minhas-solicitacoes" },
    { label: "Eventos", icon: Briefcase, to: "/events", module: "events" },
    { label: "Calendário", icon: CalendarIcon, to: "/calendar", module: "calendar" },
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

  const userRoleLabel = isMaster ? "MASTER" : isCustomer ? "CLIENTE" : "COMUM";

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
          <Button 
            variant="ghost" 
            className={cn("w-full justify-start gap-2 text-destructive", isSidebarCollapsed && "justify-center px-0")} 
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>{isSigningOut ? "Saindo..." : "Sair"}</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0 sticky top-0 z-20">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold truncate leading-tight">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </Button>

            {/* Menu Dropdown do Usuário no Cabeçalho */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-accent transition-colors text-left focus:outline-none focus:ring-2 focus:ring-ring"
                aria-expanded={userMenuOpen}
                aria-label="Menu do usuário"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/25 text-primary font-medium text-xs">
                  {profile?.nome?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                    {profile?.nome || profile?.email || "Usuário"}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {userRoleLabel}
                  </span>
                </div>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-xl py-2 z-50 animate-in fade-in-80 zoom-in-95">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {profile?.nome || profile?.email || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {profile?.email || "-"}
                    </p>
                    <div className="mt-2">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded inline-flex items-center gap-1",
                        isMaster ? "bg-primary/10 text-primary border border-primary/25" : isCustomer ? "bg-purple-500/10 text-purple-500 border border-purple-500/25" : "bg-muted text-muted-foreground border"
                      )}>
                        <Shield className="h-3 w-3" />
                        {userRoleLabel}
                      </span>
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{isSigningOut ? "Saindo..." : "Sair"}</span>
                    </button>
                  </div>
                </div>
              )}
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
