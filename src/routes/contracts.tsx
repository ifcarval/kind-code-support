import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useContractsManager, ContractItem } from "@/hooks/use-contracts-manager";
import { useCustomers } from "@/hooks/use-customers";
import { useEvents } from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, FileText, Upload, Shield, Printer, CheckCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contracts")({
  component: ContractsPage,
});

interface ContractTemplate {
  id: string;
  name: string;
  version: string;
  original_file_name?: string;
  prepared_content: string;
  is_default: boolean;
  is_active: boolean;
}

function ContractsPage() {
  const { contracts, loading, createContract, updateContract, releaseContract } = useContractsManager();
  const { customers } = useCustomers();
  const { events } = useEvents();
  const { isMaster } = usePermissions();

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);

  const [templateName, setTemplateName] = useState("Contrato Padrão Salão Santa Felicidade");
  const [templateVersion, setTemplateVersion] = useState("1.0");
  const [importedFileName, setImportedFileName] = useState("contrato-de-locacao-de-espaco.docx");
  const [templateContent, setTemplateContent] = useState(
    "INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS E LOCAÇÃO DE ESPAÇO\n\n" +
    "CONTRATANTE: {{cliente_nome}}, portador(a) do CPF/CNPJ {{cliente_documento}}, residente em {{cliente_endereco}}, telefone {{cliente_telefone}}, e-mail {{cliente_email}}.\n\n" +
    "CONTRATADA: SALÃO SANTA FELICIDADE LTDA, inscrita no CNPJ sob o nº 00.000.000/0001-00.\n\n" +
    "CLÁUSULA PRIMEIRA - DO OBJETO: O presente contrato tem por objeto a locação do espaço para o evento intitulado '{{evento_titulo}}' (Tipo: {{evento_tipo}}), a ser realizado no dia {{evento_data_inicio}} das {{evento_hora_inicio}} às {{evento_hora_termino}}, com capacidade estimada de {{evento_convidados}} convidados.\n\n" +
    "CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO: O valor total ajustado é de {{contrato_valor_total}}, com desconto de {{contrato_desconto}}, sinal de {{contrato_sinal}} e caução de {{contrato_caucao}}. O saldo previsto é de {{contrato_saldo_previsto}}.\nForma de pagamento contratada: {{contrato_forma_pagamento}}, em {{contrato_parcelas}} parcela(s) com vencimento todo dia {{contrato_vencimento}}.\n\n" +
    "CLÁUSULA TERCEIRA - DAS CONDIÇÕES GERAIS E MULTAS: Em caso de cancelamento ou atraso, aplicar-se-ão as multas previstas nas normas internas do Salão Santa Felicidade.\n\n" +
    "E por estarem justos e contratados, assinam o presente instrumento.\n\n" +
    "Contrato nº {{contrato_numero}} - Emitido em {{contrato_data_emissao}}."
  );

  const [genEventId, setGenEventId] = useState("");
  const [genTemplateId, setGenTemplateId] = useState("");
  const [genContractNumber, setGenContractNumber] = useState(`CTR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [genDiscount, setGenDiscount] = useState(0);
  const [genSignal, setGenSignal] = useState(0);
  const [genDeposit, setGenDeposit] = useState(0);
  const [genPaymentMethod, setGenPaymentMethod] = useState("PIX parcelado");
  const [genInstallments, setGenInstallments] = useState(1);
  const [genVencimento, setGenVencimento] = useState(10);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase.from("contract_templates" as any).select("*" ).order("created_at", { ascending: false });
    if (!error && data) {
      setTemplates(data as unknown as ContractTemplate[]);
      if (data.length > 0) {
        const def = data.find((t: any) => t.is_default) || data[0];
        setGenTemplateId(def.id);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportedFileName(file.name);
    toast.success(`Arquivo ${file.name} importado com sucesso! Prévia extraída para revisão.`);
  };

  const handleSaveTemplate = async () => {
    if (!isMaster) {
      toast.error("Apenas o MASTER pode importar e gerenciar modelos de contrato.");
      return;
    }
    const payload = {
      organization_id: (await supabase.auth.getSession()).data.session?.user.id,
      name: templateName,
      version: templateVersion,
      original_file_name: importedFileName,
      prepared_content: templateContent,
      is_default: templates.length === 0,
      is_active: true
    };

    const { error } = await supabase.from("contract_templates" as any).insert([payload]);
    if (error) {
      toast.error("Erro ao salvar modelo: " + error.message);
    } else {
      toast.success("Modelo de contrato importado e salvo com sucesso!");
      setIsTemplateModalOpen(false);
      fetchTemplates();
    }
  };

  const handleOpenGenerate = () => {
    if (!isMaster) {
      toast.error("Apenas o MASTER pode gerar contratos.");
      return;
    }
    setGenContractNumber(`CTR-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genEventId || !genTemplateId) {
      toast.error("Selecione o evento e o modelo de contrato.");
      return;
    }

    const selectedEvent = events.find(ev => ev.id === genEventId);
    const customer = customers.find(c => c.id === selectedEvent?.customer_id);
    const template = templates.find(t => t.id === genTemplateId);

    if (!selectedEvent) {
      toast.error("Evento selecionado inválido.");
      return;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
    const formatDate = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : "--/--/----";

    const totalVal = selectedEvent.total_value || 0;
    const saldo = totalVal - genSignal;

    let content = template?.prepared_content || "";
    const variables = {
      cliente_nome: customer?.name || customer?.nome_razao_social || "Cliente Não Informado",
      cliente_documento: customer?.document || customer?.cpf_cnpj || "000.000.000-00",
      cliente_telefone: customer?.phone || customer?.whatsapp || "(00) 00000-0000",
      cliente_email: customer?.email || "cliente@email.com",
      cliente_endereco: customer?.address || "Endereço não informado",
      evento_titulo: selectedEvent.title,
      evento_tipo: selectedEvent.event_type || "Evento",
      evento_data_inicio: formatDate(selectedEvent.start_date),
      evento_hora_inicio: selectedEvent.start_time || "14:00",
      evento_data_termino: formatDate(selectedEvent.end_date || selectedEvent.start_date),
      evento_hora_termino: selectedEvent.end_time || "22:00",
      evento_convidados: String(selectedEvent.guests || 100),
      contrato_numero: genContractNumber,
      contrato_data_emissao: new Date().toLocaleDateString('pt-BR'),
      contrato_valor_total: formatCurrency(totalVal),
      contrato_desconto: formatCurrency(genDiscount),
      contrato_sinal: formatCurrency(genSignal),
      contrato_caucao: formatCurrency(genDeposit),
      contrato_saldo_previsto: formatCurrency(saldo),
      contrato_forma_pagamento: genPaymentMethod,
      contrato_parcelas: String(genInstallments),
      contrato_vencimento: String(genVencimento)
    };

    Object.entries(variables).forEach(([key, val]) => {
      const regex = new RegExp(`{{\s*${key}\s*}}`, "g");
      content = content.replace(regex, val);
    });

    if (content.includes("{{") || content.includes("undefined") || content.includes("null")) {
      toast.warning("Atenção: Existem campos obrigatórios ou marcadores não preenchidos.");
    }

    const payload = {
      contract_number: genContractNumber,
      customer_id: selectedEvent.customer_id || null,
      event_id: selectedEvent.id,
      template_id: genTemplateId,
      status: "draft",
      released: false,
      total_amount: totalVal,
      signal_amount: genSignal,
      deposit_amount: genDeposit,
      discount_amount: genDiscount,
      installments_count: genInstallments,
      payment_method: genPaymentMethod,
      clauses: content,
      snapshot_variables: variables
    };

    const res = await createContract(payload);
    if (res.error) {
      toast.error("Erro ao gerar contrato: " + res.error.message);
    } else {
      toast.success("Contrato gerado com sucesso como rascunho!");
      setIsGenerateModalOpen(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!isMaster) {
      toast.error("Apenas o MASTER pode liberar contratos para os clientes.");
      return;
    }
    const target = contracts.find(c => c.id === id);
    if (target?.clauses?.includes("{{")) {
      toast.error("Bloqueado: Existem campos obrigatórios incompletos ou marcadores não preenchidos no contrato.");
      return;
    }
    const res = await releaseContract(id);
    if (res.error) toast.error("Erro ao liberar contrato");
    else toast.success("Contrato liberado e disponibilizado para o cliente com sucesso!");
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Gestão de Contratos e Modelos</h1>
            <p className="text-sm text-muted-foreground">Importe modelos, revise cláusulas e gere contratos personalizados por evento.</p>
          </div>
          {isMaster && (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setIsTemplateModalOpen(true)} variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Importar modelo</Button>
              <Button onClick={handleOpenGenerate} className="gap-2"><Plus className="h-4 w-4" /> Gerar Contrato por Evento</Button>
            </div>
          )}
        </div>

        {isMaster && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Modelos de contrato</CardTitle>
              <CardDescription>Modelos oficiais utilizados para extração e geração determinística de contratos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map(tpl => (
                  <div key={tpl.id} className="p-4 border rounded-lg bg-card flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-sm">{tpl.name}</h3>
                        <Badge variant={tpl.is_default ? "default" : "outline"}>v{tpl.version} {tpl.is_default && "(Padrão)"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">Arquivo: {tpl.original_file_name || "Modelo Base"}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Status: Ativo</span>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setTemplateName(tpl.name);
                        setTemplateContent(tpl.prepared_content);
                        setTemplateVersion(tpl.version);
                        setIsTemplateModalOpen(true);
                      }}>Revisar</Button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-3 py-4 text-center">Nenhum modelo importado. Clique em &quot;Importar modelo&quot; para iniciar.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Contratos Emitidos (Rascunhos e Liberados)</CardTitle></CardHeader>
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
                    <TableHead>Disponível Cliente</TableHead>
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
                        <Badge variant={item.status === 'active' || item.released ? 'default' : 'secondary'}>
                          {item.released ? 'Liberado' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.released ? (
                          <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Sim</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Não (Rascunho)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedContract(item); setIsPreviewOpen(true); }} title="Prévia e Impressão"><FileText className="h-4 w-4" /></Button>
                          {isMaster && !item.released && (
                            <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-xs" onClick={() => handleRelease(item.id)} title="Liberar para o Cliente">Liberar</Button>
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

        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importar e Revisar Modelo de Contrato</DialogTitle>
              <DialogDescription>Importe um arquivo .docx ou PDF com texto, revise o conteúdo preparado e defina marcadores variáveis.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nome do Modelo</Label>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Versão</Label>
                  <Input value={templateVersion} onChange={(e) => setTemplateVersion(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Selecionar Arquivo (.docx / PDF / TXT)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept=".docx,.pdf,.txt" onChange={handleFileUpload} />
                </div>
                <p className="text-xs text-muted-foreground">Arquivo de referência: {importedFileName}</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1 text-primary"><AlertTriangle className="h-3.5 w-3.5" /> Campos Automáticos Disponíveis para Substituição:</p>
                <p className="text-muted-foreground">{"{{cliente_nome}}, {{cliente_documento}}, {{cliente_telefone}}, {{cliente_email}}, {{cliente_endereco}}, {{evento_titulo}}, {{evento_tipo}}, {{evento_data_inicio}}, {{evento_hora_inicio}}, {{evento_data_termino}}, {{evento_hora_termino}}, {{evento_convidados}}, {{contrato_numero}}, {{contrato_data_emissao}}, {{contrato_valor_total}}, {{contrato_desconto}}, {{contrato_sinal}}, {{contrato_caucao}}, {{contrato_saldo_previsto}}, {{contrato_forma_pagamento}}, {{contrato_parcelas}}, {{contrato_vencimento}}"}</p>
              </div>

              <div className="space-y-1">
                <Label>Conteúdo Preparado do Modelo (Texto Fixo + Marcadores)</Label>
                <Textarea rows={10} value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveTemplate}>Salvar e Ativar Modelo</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerar Contrato a Partir do Evento</DialogTitle>
              <DialogDescription>Selecione o evento, o modelo ativo e confira os valores e condições antes de gerar o rascunho.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Selecionar Evento</Label>
                  <Select value={genEventId} onValueChange={setGenEventId} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                    <SelectContent>
                      {events.map(ev => (
                        <SelectItem key={ev.id} value={ev.id}>{ev.title} ({ev.start_date})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Modelo Ativo</Label>
                  <Select value={genTemplateId} onValueChange={setGenTemplateId} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name} (v{t.version})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Número do Contrato</Label>
                  <Input value={genContractNumber} onChange={(e) => setGenContractNumber(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Forma de Pagamento Contratada</Label>
                  <Input value={genPaymentMethod} onChange={(e) => setGenPaymentMethod(e.target.value)} placeholder="Ex: PIX parcelado" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Sinal Previsto</Label>
                  <CurrencyInput value={genSignal} onChange={setGenSignal} />
                </div>
                <div className="space-y-1.5">
                  <Label>Caução Prevista</Label>
                  <CurrencyInput value={genDeposit} onChange={setGenDeposit} />
                </div>
                <div className="space-y-1.5">
                  <Label>Desconto</Label>
                  <CurrencyInput value={genDiscount} onChange={setGenDiscount} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Número de Parcelas</Label>
                  <Input type="number" value={genInstallments} onChange={(e) => setGenInstallments(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dia de Vencimento</Label>
                  <Input type="number" value={genVencimento} onChange={(e) => setGenVencimento(Number(e.target.value))} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Gerar Rascunho do Contrato</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Prévia do Contrato: {selectedContract?.contract_number}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.print()} className="gap-1"><Printer className="h-4 w-4" /> Imprimir</Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-4 p-6 bg-white text-black rounded border font-serif">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold uppercase">SALÃO SANTA FELICIDADE - INSTRUMENTO CONTRATUAL</h2>
                  <p className="text-sm text-gray-600">Contrato nº {selectedContract.contract_number} (Versão v{selectedContract.current_version}) | Status: {selectedContract.released ? 'Liberado' : 'Rascunho'}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {selectedContract.clauses || "Nenhuma cláusula especificada."}
                  </div>
                </div>

                <div className="border-t pt-8 mt-12 grid grid-cols-2 text-center text-sm">
                  <div>
                    <div className="border-t border-black w-3/4 mx-auto pt-1">Contratante / Cliente</div>
                  </div>
                  <div>
                    <div className="border-t border-black w-3/4 mx-auto pt-1">Salão Santa Felicidade LTDA</div>
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