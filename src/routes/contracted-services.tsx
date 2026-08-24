import { createFileRoute } from "@tanstack/react-router";
import { useContractedServices } from "@/hooks/use-contracted-services";
import { useClients } from "@/hooks/use-clients";
import { useServices } from "@/hooks/use-services";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertTriangle
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
    generateManualInvoice
  } = useContractedServices();
  
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Serviços Contratados
        </h1>
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
                        <Button variant="ghost" size="icon" title="Editar">
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
    </div>
  );
}
