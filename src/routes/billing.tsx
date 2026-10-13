import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useFinances, FinanceItem } from "@/hooks/use-finances";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, DollarSign, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { finances, loading, stats, createFinance, updateFinance, deleteFinance, calculateReceiptsByEvent } = useFinances();
  const { events } = useEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEventIdForCalc, setSelectedEventIdForCalc] = useState<string>("");

  const [formData, setFormData] = useState({
    description: "",
    type: "income" as 'income' | 'expense',
    category: "Geral",
    status: "pending" as 'pending' | 'paid' | 'overdue' | 'cancelled',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    event_id: ""
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      description: "",
      type: "income",
      category: "Geral",
      status: "pending",
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      event_id: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FinanceItem) => {
    setEditingId(item.id);
    setFormData({
      description: item.description,
      type: item.type,
      category: item.category || "Geral",
      status: item.status,
      amount: item.amount,
      due_date: item.due_date || new Date().toISOString().split('T')[0],
      event_id: item.event_id || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      event_id: formData.event_id || null
    };

    let res;
    if (editingId) {
      res = await updateFinance(editingId, payload);
    } else {
      res = await createFinance(payload);
    }

    if (res.error) {
      toast.error("Erro ao salvar lançamento: " + res.error.message);
    } else {
      toast.success(editingId ? "Lançamento atualizado!" : "Lançamento criado!");
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este lançamento financeiro?")) {
      const { error } = await deleteFinance(id);
      if (error) toast.error("Erro ao excluir: " + error.message);
      else toast.success("Lançamento excluído.");
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6" /> Financeiro (Tabela finances)</h1>
          <Button onClick={handleOpenCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Lançamento</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalReceived)}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Pago (Despesas)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalPaid)}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Valores Pendentes</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalPending)}</div></CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.balance)}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Cálculo de Recebimentos por Evento</CardTitle></CardHeader>
          <CardContent className="flex gap-4 items-center">
            <Select value={selectedEventIdForCalc} onValueChange={setSelectedEventIdForCalc}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Selecione um evento" /></SelectTrigger>
              <SelectContent>
                {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedEventIdForCalc && (
              <div className="text-lg font-semibold">
                Recebido no Evento: <span className="text-emerald-600">{formatCurrency(calculateReceiptsByEvent(selectedEventIdForCalc))}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lançamentos Financeiros</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finances.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'income' ? 'default' : 'destructive'}>
                          {item.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.event?.title || '-'}</TableCell>
                      <TableCell>{item.due_date ? format(new Date(item.due_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                      <TableCell className={item.type === 'income' ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'paid' ? 'success' : item.status === 'pending' ? 'warning' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Lançamento" : "Novo Lançamento Financeiro"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago / Recebido</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <CurrencyInput value={formData.amount} onChange={(v) => setFormData({...formData, amount: v})} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Vencimento</Label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Vincular Evento (Opcional)</Label>
                <Select value={formData.event_id} onValueChange={(v) => setFormData({...formData, event_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}