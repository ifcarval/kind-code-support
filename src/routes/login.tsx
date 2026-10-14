import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        setSessionLoading(false);
      }
    });
  }, [navigate]);

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/dashboard", replace: true });
    }, 400);
  };

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
        if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid")) {
          toast.error("E-mail ou senha incorretos.");
        } else {
          toast.error(error.message || "E-mail ou senha incorretos.");
        }
      } else if (!data.session) {
        toast.error("Sessão não foi criada corretamente. Tente novamente.");
      } else {
        toast.success("Login realizado com sucesso!");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err: any) {
      toast.error("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword || !phone) {
      toast.error("Preencha todos os campos do cadastro.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome: fullName.trim(),
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: "customer"
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: email.trim(),
          nome: fullName.trim(),
          telefone: phone.trim(),
          role: "customer"
        });

        await supabase.from("clients").insert({
          nome_razao_social: fullName.trim(),
          email: email.trim(),
          telefone: phone.trim(),
          tipo_pessoa: "fisica"
        }).select().maybeSingle();
      }

      toast.success("Conta criada com sucesso! Você já pode acessar.");
      setIsRegisterMode(false);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotMode(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar recuperação.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 text-zinc-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 scale-105 blur-[1px]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />
      <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-[2px] z-0" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Salão Santa Felicidade</h1>
          <p className="text-sm text-zinc-400 mt-2">Consulte as datas disponíveis para o seu evento</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              {isRegisterMode
                ? "Criar minha conta"
                : isForgotMode
                ? "Recuperar Senha"
                : "Entrar na sua conta"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {isRegisterMode
                ? "Preencha os dados abaixo para se cadastrar como cliente."
                : isForgotMode
                ? "Informe seu e-mail para receber as instruções de redefinição."
                : "Insira suas credenciais abaixo para acessar o sistema."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRegisterMode ? (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-zinc-300">Nome completo</Label>
                  <Input
                    type="text"
                    placeholder="Seu Nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-300">E-mail</Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-300">Telefone / WhatsApp</Label>
                  <Input
                    type="text"
                    placeholder="(41) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-300">Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white pr-10"
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
                <div className="space-y-1">
                  <Label className="text-zinc-300">Confirmar senha</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium mt-2" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className="text-xs text-purple-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="h-3 w-3" /> Voltar para o login
                  </button>
                </div>
              </form>
            ) : isForgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white"
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
                  <Label className="text-zinc-300">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-300">Senha</Label>
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
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white"
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDemoLogin}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-medium mt-2 border border-purple-500/30"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar em Modo Demonstração
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRegisterMode(true)}
                  className="w-full border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 mt-2 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" /> Criar minha conta
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            Salão Santa Felicidade • Sistema Seguro
          </CardFooter>
        </Card>+
      </div>
    </div>
  );
}
