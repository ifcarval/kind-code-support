import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useClientDetails } from "@/hooks/use-client-details";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Briefcase, 
  History,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/clients/$id")({
  component: ClientDetailsPage,
});

function ClientDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { client, services, invoices, stats, loading } = useClientDetails(id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p>Cliente não encontrado.</p>
        <Button onClick={() => navigate({ to: "/clients" })} variant="link">Voltar para listagem</Button>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/clients" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{client.nome_razao_social}</h1>
        <Badge variant={client.status === "ativo" ? "default" : "secondary"}>{client.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Faturado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.totalFaturado)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Recebido</CardDescription>
            <CardTitle className="text-2xl text-success">{formatCurrency(stats.totalPago)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em Aberto</CardDescription>
            <CardTitle className="text-2xl text-warning">{formatCurrency(stats.totalEmAberto)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencido</CardDescription>
            <CardTitle className="text-2xl text-destructive">{formatCurrency(stats.totalVencido)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Dados Cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">Tipo / Documento</p>
              <p className="text-sm">{client.tipo_pessoa === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física'} - {client.cpf_cnpj}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">Contato</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5" /> {client.email}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5" /> {client.telefone}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">Endereço</p>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 mt-0.5" />
                <span>
                  {client.endereco}<br />
                  {client.cidade} - {client.estado}<br />
                  CEP: {client.cep}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5" />
              Serviços Contratados
            </CardTitle>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar Serviço
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome_servico}</TableCell>
                    <TableCell>{formatCurrency(s.valor_mensal)}</TableCell>
                    <TableCell>{format(new Date(s.data_inicio), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'ativo' ? 'default' : 'secondary'}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Nenhum serviço vinculado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Histórico de Cobranças
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Fatura Manual
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Fatura</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.numero_fatura}</TableCell>
                  <TableCell>{format(new Date(inv.data_vencimento), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{inv.competencia}</TableCell>
                  <TableCell>{formatCurrency(inv.valor_final)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      inv.status === 'paga' ? 'default' : 
                      inv.status === 'vencida' ? 'destructive' : 'secondary'
                    }>
                      {inv.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhuma cobrança registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
