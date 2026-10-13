import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useContractsManager, ContractItem } from "@/hooks/use-contracts-manager";
import { useCustomers } from "@/hooks/use-customers";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, FileText, Edit, Copy, CheckCircle, Printer, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { toast } from "sonner";

export const Route = createFileRoute("/contracts")({
  component: ContractsPage,
});

function ContractsPage() {
  const { contracts, loading, createContract, updateContract, duplicateContract, signManually } = useContractsManager();
  const { customers } = useCustomers();
  const { events } = useEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);

  const [formData, setFormData] = useState({
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
    clauses: "Cláusula 1: O presente contrato rege a prestação de serviços e aluguel...\nCláusula 2: O pagamento deverá ser efetuado conforme combinado...",
    total_amount: 0
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
      clauses: "Cláusula 1: O presente contrato rege a prestação de serviços e aluguel...",
      total_amount: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ContractItem) => {
    setEditingId(item.id);
    setFormData({
      contract_number: item.contract_number,
      customer_id: item.customer_id || "",
      event_id: item.event_id || "",
      status: item.status,
      payment_method: item.payment_method || "pix",
      deposit_amount: item.deposit_amount || 0,
      signal_amount: item.signal_amount || 0,
      discount_amount: item.discount_amount || 0,
      installments_count: item.installments_count || 1,
      fine_percentage: item.fine_percentage || 2,
      interest_percentage: item.interest_percentage || 1,
      clauses: item.clauses || "",
      total_amount: item.total_amount || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      customer_id: formData.customer_id || null,
      event_id: formData.event_id || null
    };

    let res;
    if (editingId) {
      res = await updateContract(editingId, payload);
    } else {
      res = await createContract(payload);
    }

    if (res.error) {
      toast.error("Erro ao salvar contrato: " + res.error.message);
    } else {
      toast.success(editingId ? "Contrato atualizado (Nova Versão criada)!" : "Contrato criado!");
      setIsModalOpen(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await duplicateContract(id);
    if (res?.error) toast.error("Erro ao duplicar contrato");
    else toast.success("Contrato duplicado com sucesso!");
  };

  const handleSign = async (id: string) => {
    const { error } = await signManually(id);
    if (error) toast.error("Erro ao registrar assinatura");
    else toast.success("Assinatura manual registrada com sucesso!");
  };

  const handlePreview = (item: ContractItem) => {
    setSelectedContract(item);
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success("Gerando PDF do contrato...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Contratos (Tabelas contracts & contract_versions)</h1>
          <Button onClick={handleOpenCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Contrato</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Lista de Contratos</CardTitle></CardHeader>
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
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.contract_number}</TableCell>
                      <TableCell>{item.customer?.name || '-'}</TableCell>
                      <TableCell>{item.event?.title || '-'}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.total_amount || 0)}</TableCell>
                      <TableCell><Badge variant="outline">v{item.current_version}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'active' ? 'default' : item.status === 'signed' ? 'success' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => handlePreview(item)} title="Prévia / Impressão / PDF"><FileText className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)} title="Editar"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(item.id)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                          {!item.signed_manually && (
                            <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => handleSign(item.id)} title="Registrar Assinatura Manual"><CheckCircle className="h-4 w-4" /></Button>
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

        {/* Modal de Criação / Edição */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Contrato (Gera Nova Versão)" : "Novo Contrato"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Número do Contrato</Label>
                  <Input value={formData.contract_number} onChange={(e) => setFormData({...formData, contract_number: e.target.value})} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="signed">Assinado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Select value={formData.customer_id} onValueChange={(v) => setFormData({...formData, customer_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Evento Vinculado</Label>
                  <Select value={formData.event_id} onValueChange={(v) => setFormData({...formData, event_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor Total</Label>
                  <CurrencyInput value={formData.total_amount} onChange={(v) => setFormData({...formData, total_amount: v})} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Sinal</Label>
                  <CurrencyInput value={formData.signal_amount} onChange={(v) => setFormData({...formData, signal_amount: v})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Caução</Label>
                  <CurrencyInput value={formData.deposit_amount} onChange={(v) => setFormData({...formData, deposit_amount: v})} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Desconto</Label>
                  <CurrencyInput value={formData.discount_amount} onChange={(v) => setFormData({...formData, discount_amount: v})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Parcelas</Label>
                  <Input type="number" value={formData.installments_count} onChange={(e) => setFormData({...formData, installments_count: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Multa (%)</Label>
                  <Input type="number" value={formData.fine_percentage} onChange={(e) => setFormData({...formData, fine_percentage: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Juros (%)</Label>
                  <Input type="number" value={formData.interest_percentage} onChange={(e) => setFormData({...formData, interest_percentage: Number(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Forma de Pagamento</Label>
                <Input value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} placeholder="Ex: PIX parcelado" />
              </div>

              <div className="space-y-1.5">
                <Label>Cláusulas do Contrato</Label>
                <Textarea rows={5} value={formData.clauses} onChange={(e) => setFormData({...formData, clauses: e.target.value})} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Contrato</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Prévia, Impressão e PDF */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Prévia do Contrato: {selectedContract?.contract_number}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handlePrint} className="gap-1"><Printer className="h-4 w-4" /> Imprimir</Button>
                  <Button size="sm" variant="secondary" onClick={handleDownloadPDF} className="gap-1"><Download className="h-4 w-4" /> PDF</Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-4 p-6 bg-white text-black rounded border font-serif">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold uppercase">INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS E LOCAÇÃO</h2>
                  <p className="text-sm text-gray-600">Contrato nº {selectedContract.contract_number} (Versão v{selectedContract.current_version})</p>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {selectedContract.customer?.name || 'Não informado'}</p>
                  <p><strong>Evento:</strong> {selectedContract.event?.title || 'Não informado'}</p>
                  <p><strong>Valor Total:</strong> {formatCurrency(selectedContract.total_amount || 0)}</p>
                  <p><strong>Sinal:</strong> {formatCurrency(selectedContract.signal_amount || 0)} | <strong>Caução:</strong> {formatCurrency(selectedContract.deposit_amount || 0)}</p>
                  <p><strong>Forma de Pagamento:</strong> {selectedContract.payment_method || 'PIX'} ({selectedContract.installments_count || 1}x)</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-2">CLÁUSULAS E CONDIÇÔES:</h3>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {selectedContract.clauses || "Nenhuma cláusula especificada."}
                  </div>
                </div>

                <div className="border-t pt-8 mt-12 grid grid-cols-2 text-center text-sm">
                  <div>
                    <div className="border-t border-black w-3/4 mx-auto pt-1">Contratante / Cliente</div>
                  </div>
                  <div>
                    <div className="border-t border-black w-3/4 mx-auto pt-1">Contratada / Organização</div>
                    {selectedContract.signed_manually && (
                      <p className="text-xs text-emerald-600 mt-1 font-sans">✓ Assinado manualmente em {new Date(selectedContract.signed_at || '').toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
