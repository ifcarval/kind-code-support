import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useBilling } from "@/hooks/use-billing";
import { useClients } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    fetchInvoices({ search: searchTerm, status: statusFilter, client_id: clientFilter });
  }, [statusFilter, clientFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices({ search: searchTerm, status: statusFilter, client_id: clientFilter });
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

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string, variant: any, icon: any, className: string }> = {
      paga: { label: "Paga", variant: "success", icon: <CheckCircle2 className="h-3 w-3" />, className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
      pendente: { label: "Pendente", variant: "warning", icon: <Calendar className="h-3 w-3" />, className: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200" },
      vencida: { label: "Vencida", variant: "destructive", icon: <AlertCircle className="h-3 w-3" />, className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" },
      rascunho: { label: "Rascunho", variant: "secondary", icon: <RefreshCcw className="h-3 w-3" />, className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" },
      cancelada: { label: "Cancelada", variant: "outline", icon: <XCircle className="h-3 w-3" />, className: "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200" },
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
          <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6" /> Cobranças</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Gerar Mensais
            </Button>
            <Button className="gap-2" onClick={handleOpenForm}><Plus className="h-4 w-4" /> Nova Fatura</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Pendente</CardTitle><DollarSign className="h-4 w-4 text-orange-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.total_pending)}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Vencido</CardTitle><AlertCircle className="h-4 w-4 text-red-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_overdue)}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle><CheckCircle2 className="h-4 w-4 text-emerald-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total_paid)}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input placeholder="Nº Fatura ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Clientes</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_razao_social}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary"><Filter className="h-4 w-4 mr-2" /> Filtrar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Fatura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.numero_fatura}</TableCell>
                  <TableCell>{invoice.client?.nome_razao_social}</TableCell>
                  <TableCell>{format(new Date(invoice.data_vencimento), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{formatCurrency(invoice.valor_final)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedInvoice(invoice); setDetailsOpen(true); }}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Fatura Manual</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveInvoice} className="space-y-4">
              <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})} required>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_razao_social}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Descrição" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} required />
              <Input type="number" step="0.01" value={formData.valor_original} onChange={(e) => setFormData({...formData, valor_original: parseFloat(e.target.value)})} required />
              <Input type="date" value={formData.data_vencimento} onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})} required />
              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar Lembrete</DialogTitle></DialogHeader>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <DialogFooter><Button onClick={handleSendReminder}>Enviar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
