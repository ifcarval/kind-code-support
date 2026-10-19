import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, Loader2, UserPlus, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
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

  const checkPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-zinc-700", textColor: "text-zinc-500" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const obviousPasswords = ["123456", "12345678", "password", "senha123", "admin123"];
    const lowerPwd = pwd.toLowerCase();
    const firstName = fullName ? fullName.toLowerCase().trim().split(" ")[0] : "";
    const isObvious = obviousPasswords.includes(lowerPwd) || 
      (firstName.length > 2 && lowerPwd.includes(firstName)) ||
      lowerPwd.includes("santa") || lowerPwd.includes("felicidade");

    if (isObvious || score < 3 || pwd.length < 8) {
      return { score: 1, label: "Fraca", color: "bg-red-500", textColor: "text-red-400" };
    } else if (score < 5) {
      return { score: 2, label: "Média", color: "bg-amber-500", textColor: "text-amber-400" };
    } else {
      return { score: 3, label: "Forte", color: "bg-emerald-500", textColor: "text-emerald-400" };
    }
  };

  const validatePasswordRules = (pwd: string, name?: string) => {
    if (pwd.length < 8) {
      return "A senha deve ter no mínimo 8 caracteres.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "A senha deve conter pelo menos 1 letra maiúscula.";
    }
    if (!/[a-z]/.test(pwd)) {
      return "A senha deve conter pelo menos 1 letra minúscula.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "A senha deve conter pelo menos 1 número.";
    }
    if (!/[^A-Za-z0-9]/.test(pwd)) {
      return "A senha deve conter pelo menos 1 caractere especial.";
    }

    const obviousPasswords = ["123456", "12345678", "password", "senha123", "admin123"];
    const lowerPwd = pwd.toLowerCase();
    if (obviousPasswords.includes(lowerPwd)) {
      return "Essa senha é muito óbvia e fácil de adivinhar. Escolha outra.";
    }
    if (name) {
      const firstName = name.toLowerCase().trim().split(" ")[0];
      if (firstName.length > 2 && lowerPwd.includes(firstName)) {
        return "A senha não pode conter seu nome.";
      }
    }
    if (lowerPwd.includes("santa") || lowerPwd.includes("felicidade")) {
      return "A senha não pode conter o nome da empresa.";
    }
    return null;
  };

  const formatSupabaseError = (msg: string) => {
    if (!msg) return "Ocorreu um erro ao processar a solicitação.";
    if (
      msg.toLowerCase().includes("weak") ||
      msg.toLowerCase().includes("easy to guess") ||
      msg.toLowerCase().includes("password")
    ) {
      return "Essa senha é muito fraca ou fácil de adivinhar. Escolha uma senha mais segura.";
    }
    return msg;
  };

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
          toast.error(formatSupabaseError(error.message));
        }
      } else if (!data.session) {
        toast.error("Sessão não foi criada corretamente. Tente novamente.");
      } else {
        console.log('SESSION OK');
        
        // Buscar profile para determinar redirecionamento correto
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .maybeSingle();

        console.log('PROFILE OK');
        console.log('AUTH READY');

        toast.success("Login realizado com sucesso!");
        
        const role = (userProfile?.role || "").toLowerCase();
        if (role === "customer" || role === "common") {
          navigate({ to: "/meus-contratos", replace: true });
        } else {
          navigate({ to: "/dashboard", replace: true });
        }
      }
    } catch (err: any) {
      console.error('LOGIN ERROR:', err);
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
    const pwdError = validatePasswordRules(password, fullName);
    if (pwdError) {
      toast.error(pwdError);
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

      if (error) {
        throw new Error(formatSupabaseError(error.message));
      }

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
      toast.error(formatSupabaseError(err.message || "Erro ao criar conta."));
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
      if (error) {
        throw new Error(formatSupabaseError(error.message));
      }
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotMode(false);
    } catch (err: any) {
      toast.error(formatSupabaseError(err.message || "Erro ao solicitar recuperação."));
    } finally {
      setLoading(false);
    }
  };

  const strength = checkPasswordStrength(password);

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
                      placeholder="Digite uma senha segura"
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

                  {/* Regras e Indicador Visual de Senha */}
                  {password && (
                    <div className="mt-2 space-y-2 rounded-md bg-zinc-950/60 p-2.5 border border-zinc-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-400">Segurança da senha:</span>
                        <span className={`font-semibold ${strength.textColor}`}>{strength.label}</span>
                      </div>
                      <div className="flex gap-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'} ${strength.score === 1 ? 'w-1/3' : strength.score === 2 ? 'w-2/3' : 'w-full'}`} />
                      </div>

                      <div className="grid grid-cols-1 gap-1 pt-1 text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          {password.length >= 8 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                          <span className={password.length >= 8 ? "text-zinc-200" : "text-zinc-400"}>Mínimo de 8 caracteres</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/[A-Z]/.test(password) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                          <span className={/[A-Z]/.test(password) ? "text-zinc-200" : "text-zinc-400"}>Pelo menos 1 letra maiúscula</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/[a-z]/.test(password) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                          <span className={/[a-z]/.test(password) ? "text-zinc-200" : "text-zinc-400"}>Pelo menos 1 letra minúscula</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/[0-9]/.test(password) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                          <span className={/[0-9]/.test(password) ? "text-zinc-200" : "text-zinc-400"}>Pelo menos 1 número</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/[^A-Za-z0-9]/.test(password) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                          <span className={/[^A-Za-z0-9]/.test(password) ? "text-zinc-200" : "text-zinc-400"}>Pelo menos 1 caractere especial</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                  <p className="text-xs text-zinc-400">
                    Ao redefinir sua senha pelo link recebido por e-mail, lembre-se de usar uma senha segura com no mínimo 8 caracteres, letras maiúsculas e minúsculas, números e caracteres especiais.
                  </p>
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
                  variant="outline"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/disponibilidade`
                        }
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      toast.error("Erro ao autenticar com Google: " + (err.message || "Tente novamente."));
                      setLoading(false);
                    }
                  }}
                  className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-medium mt-2 border border-zinc-300 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continuar com Google
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate({ to: "/agendamentos" })}
                  className="w-full text-purple-400 hover:text-purple-300 font-medium text-xs mt-1"
                >
                  Consultar datas disponíveis
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
        </Card>
      </div>
    </div>
  );
}
