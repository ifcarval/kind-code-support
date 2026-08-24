import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LayoutDashboard, Users, Settings, LogOut, Receipt } from "lucide-react";

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
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

function Dashboard() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Gestão Serviços</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate({ to: "/billing" })}>
            <Receipt className="h-4 w-4" />
            Faturamento
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
          <h2 className="text-lg font-semibold">Dashboard Principal</h2>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium">U</span>
            </div>
          </div>
        </header>
        
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Clientes ativos no sistema</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">Previsão para este mês</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Contratos recorrentes</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo ao Sistema</CardTitle>
              <CardDescription>
                Seu ambiente de gestão e cobranças está pronto para uso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comece cadastrando seus serviços no catálogo e depois adicione seus primeiros clientes. Analise o arquivo instrucoes.md anexo e siga todas as instruções.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
