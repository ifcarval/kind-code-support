import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Receipt, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  AlertCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return <Dashboard />;
}

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Se auto-confirmação estiver ativa, o session pode vir direto
        if (data.session) {
          toast({
            title: "Cadastro realizado!",
            description: "Sua conta foi criada com sucesso.",
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu e-mail para confirmar a conta.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na autenticação",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? "Criar conta" : "Entrar"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Preencha os dados para começar"
              : "Entre com seu e-mail e senha"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Cadastrar" : "Entrar"}
            </Button>
            <Button
              variant="link"
              className="w-full"
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? "Já tem uma conta? Entre aqui"
                : "Não tem uma conta? Cadastre-se"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { 
    stats, 
    history, 
    statusDistribution, 
    topClients, 
    profitableServices, 
    delinquentClients, 
    upcomingDates, 
    loading 
  } = useDashboardStats();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex min-h-screen bg-background">
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
          <Button variant="ghost" className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")}>
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
          <h2 className="text-lg font-semibold">Dashboard Principal</h2>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium">U</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Top Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_clients || 0}</div>
                    <p className="text-xs text-muted-foreground">Total de clientes na base</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.average_ticket || 0)}</div>
                    <p className="text-xs text-muted-foreground">Média por fatura</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {stats?.delinquency_rate ? `${stats.delinquency_rate.toFixed(1)}%` : "0%"}
                    </div>
                    <p className="text-xs text-muted-foreground">Faturas vencidas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vencidos (Total)</CardTitle>
                    <Receipt className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatCurrency(stats?.total_overdue_amount || 0)}</div>
                    <p className="text-xs text-muted-foreground">A receber em atraso</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Histórico de Receita (12 Meses)</CardTitle>
                    <CardDescription>Comparativo entre receita prevista e recebida</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR', { month: 'short' })}
                        />
                        <YAxis tickFormatter={(val) => `R$ ${val}`} />
                        <Tooltip 
                          formatter={(val: any) => formatCurrency(Number(val))}
                          labelFormatter={(label: any) => new Date(label).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="projected" name="Previsto" stroke="#8884d8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="received" name="Recebido" stroke="#82ca9d" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Distribuição de Status</CardTitle>
                    <CardDescription>Quantidade de faturas por status</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                          label={(entry: any) => entry.status}
                        >
                          {statusDistribution.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] || "#8884d8"} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Info Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Top Clients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Maiores Clientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topClients.map((client, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{client.client_name}</p>
                            <p className="text-xs text-muted-foreground">{client.invoice_count} faturas</p>
                          </div>
                          <div className="text-sm font-medium">{formatCurrency(client.total_projected)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Profitable Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Serviços Rentáveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profitableServices.map((service, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{service.service_name}</p>
                            <p className="text-xs text-muted-foreground">{service.active_contracts} contratos ativos</p>
                          </div>
                          <div className="text-sm font-medium">{formatCurrency(service.monthly_revenue)}/mês</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Due Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Próximos Vencimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingDates.length > 0 ? upcomingDates.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{item.client_name}</p>
                            <p className={cn(
                              "text-xs font-medium",
                              item.days_until <= 3 ? "text-destructive" : "text-muted-foreground"
                            )}>
                              Vence em {item.days_until} {item.days_until === 1 ? 'dia' : 'dias'}
                            </p>
                          </div>
                          <div className="text-sm font-medium">{formatCurrency(item.valor_final)}</div>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum vencimento próximo</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Inadimplência Alert */}
              {delinquentClients.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Atenção: Clientes Inadimplentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {delinquentClients.map((client, i) => (
                        <div key={i} className="flex flex-col p-3 border rounded-md bg-card">
                          <span className="text-sm font-bold truncate">{client.client_name}</span>
                          <span className="text-xs text-muted-foreground">{client.overdue_count} faturas atrasadas</span>
                          <span className="text-sm font-bold text-destructive mt-1">{formatCurrency(client.total_overdue)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Bem-vindo ao Sistema</CardTitle>
                  <CardDescription>
                    Seu ambiente de gestão e cobranças está pronto para uso.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe aqui o desempenho financeiro da sua empresa em tempo real.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
