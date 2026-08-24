import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useContractedServices } from "@/hooks/use-contracted-services";

import { useClients } from "@/hooks/use-clients";
import { useServices } from "@/hooks/use-services";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Briefcase, 
  Pause, 
  Play, 
  XCircle, 
  Edit, 
  Receipt,
  Search,
  Filter,
  Upload,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Plus
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { processContractFile } from "@/lib/contracts.functions";

export const Route = createFileRoute("/contracted-services")({
  component: ContractedServicesPage,
});

function ContractedServicesPage() {
  const { 
    contractedServices, 
    loading, 
    pauseContract, 
    reactivateContract, 
    cancelContract,
    generateManualInvoice,
    createContract,
    updateContractedService
  } = useContractedServices();
  
  const { clients } = useClients();
  const { services } = useServices();
  const { profile, isOwner, isLoading: profileLoading } = useProfile();
  
  if (!profileLoading && !isOwner) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive flex justify-center mb-2">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar os serviços contratados. 
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

  
  const [searchTerm, setSearchTerm] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    client_id: "",
    service_id: "",
    valor_mensal: 0,
    dia_vencimento: 10,
    data_inicio: new Date().toISOString().split('T')[0],
    tipo_cobranca: 'mensal'
  });

  const handleOpenForm = (contract?: any) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        client_id: contract.client_id,
        service_id: contract.service_id,
        valor_mensal: contract.valor_mensal,
        dia_vencimento: contract.dia_vencimento,
        data_inicio: contract.data_inicio,
        tipo_cobranca: contract.tipo_cobranca
      });
    } else {
      setEditingContract(null);
      setFormData({
        client_id: "",
        service_id: "",
        valor_mensal: 0,
        dia_vencimento: 10,
        data_inicio: new Date().toISOString().split('T')[0],
        tipo_cobranca: 'mensal'
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    const data = {
      ...formData,
      nome_servico: services.find(s => s.id === formData.service_id)?.nome || "Serviço",
      company_id: profile.company_id,
      status: 'ativo'
    };

    let result;
    if (editingContract) {
      result = await updateContractedService(editingContract.id, data);
    } else {
      result = await createContract(data);
    }

    if (result.error) toast.error("Erro ao salvar contrato: " + result.error.message);
    else {
      toast.success(editingContract ? "Contrato atualizado!" : "Contrato criado!");
      setIsFormModalOpen(false);
    }
  };
  
  const [isUploading, setIsUploading] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.company_id) return;

    setIsUploading(true);
    setImportStep('processing');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${profile.company_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      const result = await processContractFile({
        data: {
          fileUrl: publicUrl,
          fileName: file.name
        }
      });

      setExtractedData(result.extractedData);
      setImportStep('review');
    } catch (error: any) {
      toast.error("Erro no processamento: " + error.message);
      setImportStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!profile?.company_id || !extractedData) return;
    
    let clientId = clients.find(c => c.nome_razao_social.toLowerCase().includes(extractedData?.clientName?.toLowerCase() || ""))?.id;
    
    if (!clientId) {
      const { data: newClient, error: clientError } = await supabase.from('clients').insert({
        company_id: profile.company_id,
        nome_razao_social: extractedData.clientName,
        cpf_cnpj: extractedData.cpfCnpj,
        status: 'ativo' as const
      }).select().single();
      
      if (clientError) {
        toast.error("Erro ao criar cliente: " + clientError.message);
        return;
      }
      clientId = newClient.id;
    }

    let serviceId = services.find(s => s.nome.toLowerCase().includes(extractedData?.serviceName?.toLowerCase() || ""))?.id;
    if (!serviceId && services && services.length > 0) {
      const firstService = services[0];
      if (firstService) serviceId = firstService.id;
    }
    if (!serviceId) {
      toast.error("Nenhum serviço disponível no catálogo para vincular.");
      return;
    }

    const { error } = await createContract({
      company_id: profile.company_id,
      client_id: clientId,
      service_id: serviceId,
      nome_servico: extractedData.serviceName,
      valor_mensal: extractedData.monthlyValue,
      dia_vencimento: extractedData.dueDay,
      data_inicio: extractedData.startDate,
      status: 'ativo',
      tipo_cobranca: 'mensal'
    });

    if (error) {
      toast.error("Erro ao criar contrato: " + error.message);
    } else {
      toast.success("Contrato importado e ativado com sucesso!");
      setIsImportModalOpen(false);
      setImportStep('upload');
      setExtractedData(null);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, any> = {
      ativo: "default",
      pausado: "warning",
      cancelado: "destructive",
      finalizado: "secondary",
    };
    return <Badge variant={variants[status || ""] || "default"}>{status || "N/A"}</Badge>;
  };

  const handlePause = async (id: string) => {
    const { error } = await pauseContract(id);
    if (error) toast.error("Erro ao pausar: " + error.message);
    else toast.success("Contrato pausado.");
  };

  const handlePlay = async (id: string) => {
    const { error } = await reactivateContract(id);
    if (error) toast.error("Erro ao reativar: " + error.message);
    else toast.success("Contrato reativado.");
  };

  const handleCancel = async (id: string) => {
    if (confirm("Tem certeza que deseja cancelar este contrato?")) {
      const { error } = await cancelContract(id);
      if (error) toast.error("Erro ao cancelar: " + error.message);
      else toast.success("Contrato cancelado.");
    }
  };

  const handleManualInvoice = async (id: string) => {
    setLoadingManual(id);
    const { error } = await generateManualInvoice(id);
    setLoadingManual(null);
    
    if (error) toast.error("Erro ao gerar fatura: " + error.message);
    else toast.success("Fatura manual gerada com sucesso.");
  };

  const calculateNextBilling = (day: number | null) => {
    if (!day) return "N/A";
    const today = new Date();
    let next = new Date(today.getFullYear(), today.getMonth(), day);
    if (next < today) next = addMonths(next, 1);
    return format(next, "dd/MM/yyyy");
  };

  const [loadingManual, setLoadingManual] = useState<string | null>(null);

  const filteredServices = contractedServices.filter(s => 
    s.client?.nome_razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nome_servico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>

    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Serviços Contratados
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenForm()} className="gap-2" variant="outline">
            <Plus className="h-4 w-4" /> Novo
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)} className="gap-2">
            <FileUp className="h-4 w-4" />
            Importar Contrato (IA)
          </Button>
        </div>
      </div>


      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <CardTitle>Gestão de Contratos Ativos</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente ou serviço..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Próxima Cobrança</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.client?.nome_razao_social}
                    </TableCell>
                    <TableCell>{s.nome_servico}</TableCell>
                    <TableCell>{formatCurrency(s.valor_mensal)}</TableCell>
                    <TableCell>Dia {s.dia_vencimento}</TableCell>
                    <TableCell>{calculateNextBilling(s.dia_vencimento)}</TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {s.status === 'ativo' ? (
                          <Button variant="ghost" size="icon" title="Pausar" onClick={() => handlePause(s.id)}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : s.status === 'pausado' ? (
                          <Button variant="ghost" size="icon" title="Reativar" onClick={() => handlePlay(s.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Gerar Cobrança Manual" 
                          onClick={() => handleManualInvoice(s.id)}
                          disabled={loadingManual === s.id}
                        >
                          {loadingManual === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Editar"
                          onClick={() => handleOpenForm(s)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive" 
                          title="Cancelar"
                          onClick={() => handleCancel(s.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum contrato encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Importação Inteligente de Contrato
            </DialogTitle>
            <DialogDescription>
              A nossa IA irá extrair automaticamente os dados do contrato para facilitar o cadastro.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {importStep === 'upload' && (
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".pdf,image/*"
                />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Clique para fazer upload</h3>
                <p className="text-sm text-muted-foreground">PDF ou Imagem (Máx 5MB)</p>
              </div>
            )}

            {importStep === 'processing' && (
              <div className="text-center p-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <h3 className="text-lg font-medium">Extraindo informações com IA...</h3>
                <p className="text-sm text-muted-foreground">Estamos analisando o documento para você.</p>
              </div>
            )}

            {importStep === 'review' && extractedData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cliente</Label>
                    <Input value={extractedData.clientName} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CPF/CNPJ</Label>
                    <Input value={extractedData.cpfCnpj} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Serviço Identificado</Label>
                    <Input value={extractedData.serviceName} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor Mensal</Label>
                    <Input value={formatCurrency(extractedData.monthlyValue)} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dia de Vencimento</Label>
                    <Input value={`Dia ${extractedData.dueDay}`} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Início</Label>
                    <Input value={format(new Date(extractedData.startDate), "dd/MM/yyyy")} readOnly className="bg-muted" />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Pronto para importar!</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      O cliente e o contrato serão criados automaticamente. Você poderá editá-los depois.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {importStep === 'review' ? (
              <div className="flex gap-2 w-full justify-end">
                <Button variant="outline" onClick={() => setImportStep('upload')}>Tentar Outro</Button>
                <Button onClick={handleConfirmImport}>Confirmar e Ativar Contrato</Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
            <DialogDescription>
              Vincule um serviço a um cliente e defina as condições.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveContract} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
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
              <Label>Serviço do Catálogo</Label>
              <Select 
                value={formData.service_id} 
                onValueChange={(v) => {
                  const s = services.find(srv => srv.id === v);
                  setFormData({
                    ...formData, 
                    service_id: v,
                    valor_mensal: s?.valor_padrao || formData.valor_mensal,
                    tipo_cobranca: s?.tipo_cobranca || formData.tipo_cobranca
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Mensal</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.valor_mensal} 
                  onChange={(e) => setFormData({...formData, valor_mensal: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Dia Vencimento</Label>
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_vencimento} 
                  onChange={(e) => setFormData({...formData, dia_vencimento: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input 
                type="date"
                value={formData.data_inicio} 
                onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Contrato</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}


