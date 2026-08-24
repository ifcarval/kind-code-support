import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";

import { useSettings } from "@/hooks/use-settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
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
  CreditCard,
  Bell,
  Plus,
  Trash2,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export const Route = createFileRoute("/settings")({
  component: SettingsGuard,
});

function SettingsGuard() {
  const { isOwner, isLoading: profileLoading } = useProfile();

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="p-6 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  if (!isOwner) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive flex justify-center mb-2">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar as configurações. 
                Esta página é restrita a proprietários.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button onClick={() => window.location.href = "/"}>Voltar ao Início</Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return <SettingsPage />;
}

function SettingsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { company, profile: profileData, loading, updateProfile, updateCompany } = useSettings();
  const { profile } = useProfile();
  const { templates, saveTemplate, deleteTemplate } = useNotifications();
  const { toast } = useToast();




  // Notifications State
  const [autoReminders, setAutoReminders] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    content: "",
    trigger_type: "manual" as any,
    days_offset: 0
  });

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
      setAutoReminders(company.auto_reminders_enabled || false);
      setWhatsappEnabled(company.whatsapp_enabled || false);
    }
  }, [profile, company]);

  const handleOpenTemplate = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateFormData({
        name: template.name,
        content: template.content,
        trigger_type: template.trigger_type,
        days_offset: template.days_offset
      });
    } else {
      setEditingTemplate(null);
      setTemplateFormData({
        name: "",
        content: "",
        trigger_type: "manual",
        days_offset: 0
      });
    }
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveTemplate({
      id: editingTemplate?.id,
      ...templateFormData
    });
    setIsTemplateModalOpen(false);
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
      date_format: dateFormat,
      auto_reminders_enabled: autoReminders,
      whatsapp_enabled: whatsappEnabled
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
    <AppLayout>

    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <ThemeToggle />
      </div>

        
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" /> Perfil
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" /> Empresa
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" /> Mensagens
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

            <TabsContent value="notifications">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Automação de Lembretes</CardTitle>
                    <CardDescription>
                      Configure como e quando os lembretes automáticos devem ser enviados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium">Lembretes Automáticos</label>
                        <p className="text-sm text-muted-foreground">
                          Enviar automaticamente mensagens baseadas nos templates de gatilho.
                        </p>
                      </div>
                      <Switch 
                        checked={autoReminders} 
                        onCheckedChange={setAutoReminders} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-0.5">
                        <label className="text-base font-medium">Integração WhatsApp</label>
                        <p className="text-sm text-muted-foreground">
                          Habilita botões de envio direto via WhatsApp (requer configuração futura).
                        </p>
                      </div>
                      <Switch 
                        checked={whatsappEnabled} 
                        onCheckedChange={setWhatsappEnabled} 
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end border-t pt-4">
                    <Button onClick={onUpdatePreferences}>Salvar Configurações</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Templates de Mensagens</CardTitle>
                      <CardDescription>
                        Padronize a comunicação com seus clientes usando tags dinâmicas.
                      </CardDescription>
                    </div>
                    <Button onClick={() => handleOpenTemplate()} className="gap-2">
                      <Plus className="h-4 w-4" /> Novo Template
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {templates.map(template => (
                        <div key={template.id} className="flex flex-col border rounded-lg overflow-hidden">
                          <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              {template.name}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenTemplate(template)}>
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate(template.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4 bg-card flex-1">
                            <p className="text-xs text-muted-foreground line-clamp-3 italic">
                              "{template.content}"
                            </p>
                          </div>
                          <div className="px-4 py-2 border-t bg-muted/20 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            <span>Tipo: {template.trigger_type}</span>
                            {template.trigger_type !== 'manual' && (
                              <span>Offset: {template.days_offset} dias</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
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

        {/* Modal CRUD Template */}
        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
              <DialogDescription>
                Use {"{cliente}"}, {"{valor}"}, {"{vencimento}"} e {"{numero}"} como variáveis.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveTemplate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Template</label>
                  <Input 
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                    placeholder="Ex: Lembrete de Atraso"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gatilho</label>
                    <Select 
                      value={templateFormData.trigger_type} 
                      onValueChange={(val) => setTemplateFormData({...templateFormData, trigger_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="due_soon">Vencendo em breve</SelectItem>
                        <SelectItem value="overdue">Atrasada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dias (Offset)</label>
                    <Input 
                      type="number"
                      value={templateFormData.days_offset}
                      onChange={(e) => setTemplateFormData({...templateFormData, days_offset: Number(e.target.value)})}
                      disabled={templateFormData.trigger_type === 'manual'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conteúdo da Mensagem</label>
                  <Textarea 
                    value={templateFormData.content}
                    onChange={(e) => setTemplateFormData({...templateFormData, content: e.target.value})}
                    placeholder="Olá {cliente}, sua fatura..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Template</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}


