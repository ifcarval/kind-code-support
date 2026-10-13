import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: "/agendamentos" });
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("[Auth] Falha no login para", email.trim(), error);
        if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid grant") || error.message.includes("Invalid")) {
          toast.error("E-mail ou senha incorretos. Verifique suas credenciais.");
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          toast.error("Não foi possível conectar ao servidor.");
        } else {
          toast.error(error.message || "E-mail ou senha incorretos.");
        }
      } else if (!data.session) {
        toast.error("Sessão não foi criada corretamente. Tente novamente.");
      } else {
        toast.success("Login realizado com sucesso!");
        navigate({ to: "/agendamentos" });
      }
    } catch (err: any) {
      console.error("[Auth] Erro inesperado no login:", err);
      toast.error("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoSession = {
      access_token: "mock-token-demo",
      refresh_token: "mock-refresh-demo",
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "mock-demo-id",
        email: email.trim() || "igor.carvalho76@gmail.com",
        aud: "authenticated",
        role: "authenticated",
        user_metadata: { name: "Administrador Demo" },
        app_metadata: { provider: "email" },
        created_at: new Date().toISOString()
      }
    };
    
    localStorage.setItem("supabase.auth.token", JSON.stringify({
      currentSession: demoSession
    }));

    toast.success("Login realizado com sucesso (Modo Demonstração)!");
    navigate({ to: "/agendamentos" });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        toast.error("Erro ao enviar e-mail: " + error.message);
      } else {
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        setIsForgotMode(false);
      }
    } catch (err: any) {
      toast.error("Erro ao solicitar recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 text-zinc-100 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 scale-105 blur-[1px]"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000&auto=format&fit=crop')` 
        }}
      />
      <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-[2px] z-0" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Salão Santa Felicidade</h1>
          <p className="text-sm text-zinc-400 mt-2">Acesso ao sistema de gerenciamento</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              {isForgotMode ? "Recuperar Senha" : "Entrar na sua conta"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {isForgotMode 
                ? "Informe seu e-mail para receber as instruções de redefinição."
                : "Insira suas credenciais abaixo para acessar o painel."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar e-mail de recuperação
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="text-xs text-purple-400 hover:underline"
                  >
                    Voltar ao login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-zinc-300">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotMode(true)}
                      className="text-xs text-purple-400 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <Button type="button" variant="outline" onClick={handleDemoLogin} className="w-full border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 mt-2">
                  Entrar em Modo Demonstração
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            Salão Santa Felicidade • Sistema Seguro
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
