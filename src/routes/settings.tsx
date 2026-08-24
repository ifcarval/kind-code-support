import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Receipt, 
  ChevronLeft, 
  ChevronRight,
  Briefcase,
  User,
  Building2,
  Globe,
  Loader2,
  Calendar,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { company, profile, loading, updateProfile, updateCompany } = useSettings();
  const { toast } = useToast();

  // Profile Form State
  const [profileName, setProfileName] = useState("");
  
  // Company Form State
  const [companyName, setCompanyName] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  
  // Preferences State
  const [dueDay, setDueDay] = useState(10);
  const [currency, setCurrency] = useState("BRL");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  useEffect(() => {
    if (profile) {
      setProfileName(profile.nome || "");
    }
    if (company) {
      setCompanyName(company.nome || "");
      setCompanyCnpj(company.cnpj || "");
      setCompanyAddress(company.endereco || "");
      setDueDay(company.due_day_default || 10);
      setCurrency(company.currency || "BRL");
      setDateFormat(company.date_format || "DD/MM/YYYY");
    }
  }, [profile, company]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const onUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ nome: profileName });
  };

  const onUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompany({ 
      nome: companyName, 
      cnpj: companyCnpj, 
      endereco: companyAddress 
    });
  };

  const onUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompany({ 
      due_day_default: dueDay, 
      currency, 
      date_format: dateFormat 
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "border-r bg-card transition-all duration-300 hidden md:flex flex-col",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("p-6 border-b flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
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
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")} onClick={() => navigate({ to: "/" })}>
            <LayoutDashboard className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")} onClick={() => navigate({ to: "/billing" })}>
            <Receipt className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Faturamento</span>}
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")} onClick={() => navigate({ to: "/clients" })}>
            <Users className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Clientes</span>}
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")} onClick={() => navigate({ to: "/services" })}>
            <Briefcase className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Catálogo Serviços</span>}
          </Button>
          <Button variant="ghost" className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")} onClick={() => navigate({ to: "/contracted-services" })}>
            <Receipt className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Serviços Contratados</span>}
          </Button>
          <Button variant="secondary" className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")} onClick={() => navigate({ to: "/settings" })}>
            <Settings className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Configurações</span>}
          </Button>
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className={cn("w-full justify-start gap-2 text-destructive", isSidebarCollapsed && "justify-center px-0")} onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0">
          <h2 className="text-lg font-semibold">Configurações</h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" /> Perfil
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" /> Empresa
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Globe className="h-4 w-4" /> Preferências
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais de acesso.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={onUpdateProfile}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome Completo</label>
                      <Input 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)} 
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">E-mail</label>
                      <Input value={profile?.id ? "Conectado via Supabase Auth" : ""} disabled />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">Salvar Perfil</Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Empresa</CardTitle>
                  <CardDescription>
                    Informações da organização para emissão de cobranças.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={onUpdateCompany}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Razão Social</label>
                      <Input 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">CNPJ</label>
                        <Input 
                          value={companyCnpj} 
                          onChange={(e) => setCompanyCnpj(e.target.value)} 
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Endereço</label>
                      <Input 
                        value={companyAddress} 
                        onChange={(e) => setCompanyAddress(e.target.value)} 
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">Atualizar Empresa</Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências do Sistema</CardTitle>
                  <CardDescription>
                    Configure padrões regionais e de faturamento.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={onUpdatePreferences}>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" /> Dia de Vencimento Padrão
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Dia do mês sugerido para novas faturas.
                        </p>
                      </div>
                      <div className="w-24">
                        <Input 
                          type="number" 
                          min="1" 
                          max="28" 
                          value={dueDay} 
                          onChange={(e) => setDueDay(Number(e.target.value))} 
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4" /> Moeda Padrão
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Moeda utilizada nos cálculos e exibição.
                        </p>
                      </div>
                      <div className="w-40">
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        >
                          <option value="BRL">Real (R$)</option>
                          <option value="USD">Dólar ($)</option>
                          <option value="EUR">Euro (€)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" /> Formato de Data
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Como as datas serão exibidas no sistema.
                        </p>
                      </div>
                      <div className="w-40">
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">Salvar Preferências</Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
