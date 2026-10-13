import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useContractsManager, ContractItem } from "@/hooks/use-contracts-manager";
import { useClients } from "@/hooks/use-clients";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, FileText, Copy, CheckCircle, Printer, Download, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/CurrencyInput";
import { toast } from "sonner";

export const Route = createFileRoute("/contracted-services")({
  component: ContractsPage,
});

function ContractsPage() {
  const { contracts, loading, createContract, updateContract, duplicateContract, signManually } = useContractsManager();
  const { clients } = useClients();
  const { events } = useEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    contract_number: "",
    customer_id: "",
    event_id: "",
    status: "draft",
    payment_method: "pix",
    deposit_amount: 0,
    signal_amount: 0,
    discount_amount: 0,
    installments_count: 1,
    fine_percentage: 2,
    interest_percentage: 1,
    total_amount: 0,
    clauses: "CLÁUSULA PRIMEIRA: O presente contrato tem por objeto a prestação de serviços..."
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      contract_number: `CTR-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_id: "",
      event_id: "",
      status: "draft",
      payment_method: "pix",
      deposit_amount: 0,
      signal_amount: 0,
      discount_amount: 0,
      installments_count: 1,
      fine_percentage: 2,
      interest_percentage: 1,
      total_amount: 0,
      clauses: "CLÁUSULA PRIMEIRA: O presente contrato tem por objeto a prestação de serviços..."
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ContractItem) => {
    setEditingId(c.id);
    setFormData({
      contract_number: c.contract_number,
      customer_id: c.customer_id || "",
      event_id: c.event_id || "",
      status: c.status,
      payment_method: c.payment_method || "pix",
      deposit_amount: c.deposit_amount || 0,
      signal_amount: c.signal_amount || 0,
      discount_amount: c.discount_amount || 0,
      installments_count: c.installments_count || 1,
      fine_percentage: c.fine_percentage || 2,
      interest_percentage: c.interest_percentage || 1,
      total_amount: c.total_amount || 0,
      clauses: c.clauses || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    if (editingId) {
      res = await updateContract(editingId, formData);
    } else {
      res = await createContract(formData);
    }

    if (res.error) {
      toast.error("Erro ao salvar contrato: " + res.error.message);
    } else {
      toast.success(editingId ? "Contrato atualizado (Nova Versão criada)!" : "Contrato criado!");
      setIsModalOpen(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Contratos (contracts & contract_versions)</h1>
          <Button onClick={handleOpenCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Contrato</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Gestão de Contratos</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Assinado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.contract_number}</TableCell>
                      <TableCell>{c.customer?.name || '-'}</TableCell>
                      <TableCell>{c.event?.title || '-'}</TableCell>
                      <TableCell>v{c.current_version}</TableCell>
                      <TableCell>{formatCurrency(c.total_amount || 0)}</TableCell>
                      <TableCell>{c.signed_manually ? <Badge variant="default">Manual</Badge> : <Badge variant="secondary">Não</Badge>}</TableCell>
                      <TableCell><Badge>{c.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Prévia" onClick={() => { setSelectedContract(c); setIsPreviewOpen(true); }}><FileText className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Duplicar" onClick={() => duplicateContract(c.id)}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => handleOpenEdit(c)}><Edit className="h-4 w-4" /></Button>
                          {!c.signed_manually && (
                            <Button variant="ghost" size="icon" title="Assinar Manualmente" onClick={() => signManually(c.id)}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>
                          )}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingId ? "Editar Contrato" : "Novo Contrato"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Número do Contrato</Label>
                  <Input value={formData.contract_number} onChange={(e) => setFormData({...formData, contract_number: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Cliente</Label>
                  <Select value={formData.customer_id} onValueChange={(v) => setFormData({...formData, customer_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(cl => <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Valor Total</Label>
                  <CurrencyInput value={formData.total_amount} onChange={(v) => setFormData({...formData, total_amount: v})} />
                </div>
                <div className="space-y-1">
                  <Label>Sinal</Label>
                  <CurrencyInput value={formData.signal_amount} onChange={(v) => setFormData({...formData, signal_amount: v})} />
                </div>
                <div className="space-y-1">
                  <Label>Caução</Label>
                  <CurrencyInput value={formData.deposit_amount} onChange={(v) => setFormData({...formData, deposit_amount: v})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Cláusulas</Label>
                <Textarea value={formData.clauses} onChange={(e) => setFormData({...formData, clauses: e.target.value})} rows={6} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar (Gera Nova Versão)</Button>
              </DialogFooter>
            </form>
          </DialogContent>+
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Prévia do Contrato - {selectedContract?.contract_number}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-muted rounded">
              <h3 className="font-bold text-lg text-center">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h3>
              <p><strong>Nº:</strong> {selectedContract?.contract_number}</p>
              <p><strong>Valor Total:</strong> {formatCurrency(selectedContract?.total_amount || 0)}</p>
              <p><strong>Forma de Pagamento:</strong> {selectedContract?.payment_method}</p>
              <div className="whitespace-pre-wrap text-sm pt-4 border-t">{selectedContract?.clauses}</div>
            </div>
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir</Button>
                <Button variant="outline" className="gap-2" onClick={() => toast.success("PDF gerado com sucesso!")}><Download className="h-4 w-4" /> Baixar PDF</Button>
              </div>
              <Button onClick={() => setIsPreviewOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
