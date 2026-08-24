import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";

import { useBilling } from "@/hooks/use-billing";
import { useClients } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  Receipt, 
  RefreshCcw, 
  Search, 
  Filter, 
  Eye, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  XCircle,
  MoreVertical,
  Download,
  Bell
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function BillingPage() {
  
  const { invoices, loading, stats, fetchInvoices, generateMonthlyInvoices, registerPayment, sendInvoiceReminder } = useBilling();
  const { clients } = useClients();
  const { templates } = useNotifications();
  
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [clientFilter, setClientFilter] = useState("todos");
  const { profile } = useProfile();
  
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    client_id: "",
    data_vencimento: new Date().toISOString().split('T')[0],
    valor_original: 0,
    descricao: "",
    competencia: format(new Date(), "MM/yyyy")
  });

  const handleOpenForm = () => {
    setFormData({
      client_id: "",
      data_vencimento: new Date().toISOString().split('T')[0],
      valor_original: 0,
      descricao: "",
      competencia: format(new Date(), "MM/yyyy")
    });
    setIsFormModalOpen(true);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    const invoiceData = {
      ...formData,
      company_id: profile.company_id,
      valor_final: formData.valor_original,
      status: 'pendente',
      numero_fatura: `MAN-${Date.now().toString().slice(-6)}`
    };

    const { error } = await supabase.from('invoices').insert(invoiceData);

    if (error) {
      toast.error("Erro ao criar fatura: " + error.message);
    } else {
      toast.success("Fatura manual criada com sucesso!");
      setIsFormModalOpen(false);
      fetchInvoices();
    }
  };

  useEffect(() => {
    fetchInvoices({
      search: searchTerm,
      status: statusFilter,
      client_id: clientFilter
    });
  }, [statusFilter, clientFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices({
      search: searchTerm,
      status: statusFilter,
      client_id: clientFilter
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const { data, error } = await generateMonthlyInvoices();
    setGenerating(false);

    if (error) {
      toast.error("Erro ao gerar faturas: " + error.message);
    } else {
      toast.success(`${data} fatura(s) gerada(s) com sucesso!`);
      fetchInvoices();
    }
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice || !selectedTemplate) return;
    
    setSendingReminder(true);
    const result = await sendInvoiceReminder(selectedInvoice.id, selectedTemplate);
    setSendingReminder(false);
    
    if (result.success) {
      toast.success("Lembrete enviado com sucesso!");
      setReminderOpen(false);
    } else {
      toast.error("Erro ao enviar lembrete: " + result.error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string, variant: any, icon: any, className: string }> = {
      paga: { 
        label: "Paga", 
        variant: "success", 
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
      },
      pendente: { 
        label: "Pendente", 
        variant: "warning", 
        icon: <Calendar className="h-3 w-3" />,
        className: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
      },
      vencida: { 
        label: "Vencida", 
        variant: "destructive", 
        icon: <AlertCircle className="h-3 w-3" />,
        className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
      },
      rascunho: { 
        label: "Rascunho", 
        variant: "secondary", 
        icon: <RefreshCcw className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
      },
      cancelada: { 
        label: "Cancelada", 
        variant: "outline", 
        icon: <XCircle className="h-3 w-3" />,
        className: "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"
      },
    };
    
    const config = configs[status] || { label: status, variant: "default", icon: null, className: "" };
    
    return (
      <Badge variant={config.variant} className={cn("gap-1 font-medium", config.className)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <AppLayout>

    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Cobranças
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Gerar Mensais
          </Button>
          <Button className="gap-2" onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4" />
            Nova Fatura
          </Button>
        </div>
      </div>


      {/* Indicadores Rápidos */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.total_pending)}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando pagamento</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vencido</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_overdue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pagamentos em atraso</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total_paid)}</div>
            <p className="text-xs text-muted-foreground mt-1">Faturas quitadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros de Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nº Fatura ou descrição..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Clientes</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nome_razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary" className="gap-2">
              <Filter className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Listagem */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px] font-bold">Nº Fatura</TableHead>
                    <TableHead className="font-bold">Cliente</TableHead>
                    <TableHead className="font-bold">Vencimento</TableHead>
                    <TableHead className="font-bold">Valor</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-medium">{invoice.numero_fatura}</TableCell>
                      <TableCell>
                        <div className="font-medium">{invoice.client?.nome_razao_social}</div>
                        {invoice.descricao && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{invoice.descricao}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(invoice.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(invoice.valor_final)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Ver Detalhes"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPaymentOpen(true);
                                }}
                                disabled={invoice.status === 'paga' || invoice.status === 'cancelada'}
                              >
                                <DollarSign className="h-4 w-4" /> Registrar Pagamento
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setSelectedTemplate(templates[0]?.id || "");
                                  setReminderOpen(true);
                                }}
                              >
                                <Bell className="h-4 w-4" /> Enviar Lembrete
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Download className="h-4 w-4" /> Baixar PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive gap-2">
                                <XCircle className="h-4 w-4" /> Cancelar Fatura
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="h-12 w-12 opacity-20" />
                          <p>Nenhuma fatura encontrada com os filtros atuais.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              Fatura {selectedInvoice?.numero_fatura}
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas da cobrança
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{selectedInvoice.client?.nome_razao_social}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Emissão</p>
                  <p className="font-medium">{selectedInvoice.data_emissao ? format(new Date(selectedInvoice.data_emissao), "dd/MM/yyyy") : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.data_vencimento), "dd/MM/yyyy")}</p>
                </div>
              </div>

              <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
                <h4 className="font-bold border-b pb-2 mb-2">Itens da Fatura</h4>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.descricao} x {item.quantidade || 1}</span>
                        <span className="font-mono">{formatCurrency(item.valor_total)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span>Total Final</span>
                      <span>{formatCurrency(selectedInvoice.valor_final)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhum item detalhado.</p>
                )}
              </div>

              {selectedInvoice.observacoes && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">Observações</p>
                  <p className="text-sm p-3 bg-muted/50 rounded-md border">{selectedInvoice.observacoes}</p>
                </div>
              )}
              
              {selectedInvoice.comprovante_url && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">Comprovante</p>
                  <a 
                    href={selectedInvoice.comprovante_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm text-primary flex items-center gap-1 hover:underline"
                  >
                    <Download className="h-3 w-3" /> Ver arquivo anexo
                  </a>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button>
            {selectedInvoice?.status !== 'paga' && selectedInvoice?.status !== 'cancelada' && (
              <Button onClick={() => { setDetailsOpen(false); setPaymentOpen(true); }}>
                Registrar Pagamento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o recebimento do valor para a fatura {selectedInvoice?.numero_fatura}
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4 py-4" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const { error } = await registerPayment({
              invoice_id: selectedInvoice.id,
              valor_pago: Number(formData.get("valor")),
              forma_pagamento: formData.get("metodo") as any,
              observacoes: formData.get("obs") as string,
              referencia_pagamento: formData.get("ref") as string,
            });
            
            if (error) {
              toast.error("Erro ao registrar pagamento: " + (error as any).message);
            } else {
              toast.success("Pagamento registrado com sucesso!");
              setPaymentOpen(false);
              fetchInvoices();
            }
          }}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Recebido</label>
              <Input name="valor" type="number" step="0.01" defaultValue={selectedInvoice?.valor_final} required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select name="metodo" defaultValue="pix">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link do Comprovante / Referência (opcional)</label>
              <Input name="ref" placeholder="https://... ou Nº Doc" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input name="obs" placeholder="Notas sobre o pagamento..." />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => setPaymentOpen(false)}>Cancelar</Button>
              <Button type="submit">Confirmar Pagamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Fatura Manual</DialogTitle>
            <DialogDescription>
              Crie uma fatura avulsa para um cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveInvoice} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select 
                value={formData.client_id} 
                onValueChange={(v) => setFormData({...formData, client_id: v})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição / Serviço</label>
              <Input 
                value={formData.descricao} 
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Ex: Consultoria Extra"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor</label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.valor_original} 
                  onChange={(e) => setFormData({...formData, valor_original: parseFloat(e.target.value)})}
                  required
                />
      {/* Modal de Envio de Lembrete */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Enviar Lembrete
            </DialogTitle>
            <DialogDescription>
              Selecione um template para enviar ao cliente {selectedInvoice?.client?.nome_razao_social}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template de Mensagem</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.trigger_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <Card className="bg-muted/30">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pré-visualização do Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4 text-sm whitespace-pre-wrap italic">
                  {templates.find(t => t.id === selectedTemplate)?.content
                    .replace("{cliente}", selectedInvoice?.client?.nome_razao_social || "Cliente")
                    .replace("{valor}", formatCurrency(selectedInvoice?.valor_final || 0))
                    .replace("{vencimento}", selectedInvoice?.data_vencimento ? format(new Date(selectedInvoice.data_vencimento), "dd/MM/yyyy") : "")
                    .replace("{numero}", selectedInvoice?.numero_fatura || "")
                  }
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleSendReminder} 
              disabled={!selectedTemplate || sendingReminder}
              className="gap-2"
            >
              {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Enviar Lembrete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Vencimento</label>
                <Input 
                  type="date"
                  value={formData.data_vencimento} 
                  onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Competência (MM/AAAA)</label>
              <Input 
                value={formData.competencia} 
                onChange={(e) => setFormData({...formData, competencia: e.target.value})}
                placeholder="08/2026"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Gerar Fatura</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

