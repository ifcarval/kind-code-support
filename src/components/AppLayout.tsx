import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/" },
    { label: "Faturamento", icon: Receipt, to: "/billing" },
    { label: "Clientes", icon: Users, to: "/clients" },
    { label: "Catálogo Serviços", icon: Briefcase, to: "/services" },
    { label: "Serviços Contratados", icon: Receipt, to: "/contracted-services" },
    { label: "Configurações", icon: Settings, to: "/settings" },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item => item.to === location.pathname);
    return current ? current.label : "Sistema";
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "border-r bg-card transition-all duration-300 hidden md:flex flex-col sticky top-0 h-screen",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("p-6 border-b flex items-center shrink-0", isSidebarCollapsed ? "justify-center" : "justify-between")}>
          {!isSidebarCollapsed && <h1 className="text-xl font-bold truncate">Gestão Serviços</h1>}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0 sticky top-0 z-10">
          <h2 className="text-lg font-semibold truncate">{getPageTitle()}</h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-medium">U</span>
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
