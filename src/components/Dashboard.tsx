import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Receipt, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  Clock,
  Briefcase
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

import { useProfile } from "@/hooks/use-profile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Dashboard() {
  const { profile } = useProfile();
  const { 
    stats, 
    history, 
    statusDistribution, 
    topClients, 
    profitableServices, 
    delinquentClients, 
    upcomingDates, 
    loading 
  } = useDashboardStats();

  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Trial Banner */}
      {profile?.company?.trial_ends_at && profile?.company?.subscription_status === 'trial' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Período de Demonstração Ativo</h3>
                  <p className="text-sm text-muted-foreground">
                    Seu acesso expira em {format(new Date(profile.company.trial_ends_at), "dd 'de' MMMM", { locale: ptBR })}.
                  </p>
                </div>
              </div>
              <Button size="sm">Assinar Agora</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_clients || 0}</div>
            <p className="text-xs text-muted-foreground">Total de clientes na base</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.average_ticket || 0)}</div>
            <p className="text-xs text-muted-foreground">Média por fatura</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.delinquency_rate ? `${stats.delinquency_rate.toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">Faturas vencidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos (Total)</CardTitle>
            <Receipt className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats?.total_overdue_amount || 0)}</div>
            <p className="text-xs text-muted-foreground">A receber em atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Histórico de Receita (12 Meses)</CardTitle>
            <CardDescription>Comparativo entre receita prevista e recebida</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(str: string) => new Date(str).toLocaleDateString('pt-BR', { month: 'short' })}
                />
                <YAxis tickFormatter={(val: number) => `R$ ${val}`} />
                <Tooltip 
                  formatter={(val: any) => formatCurrency(Number(val))}
                  labelFormatter={(label: any) => new Date(label).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                />
                <Legend />
                <Line type="monotone" dataKey="projected" name="Previsto" stroke="#8884d8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="received" name="Recebido" stroke="#82ca9d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Quantidade de faturas por status</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                  label={(entry: any) => entry.status}
                >
                  {statusDistribution.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Info Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Maiores Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{client.client_name}</p>
                    <p className="text-xs text-muted-foreground">{client.invoice_count} faturas</p>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(client.total_projected)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profitable Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Serviços Rentáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitableServices.map((service: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{service.service_name}</p>
                    <p className="text-xs text-muted-foreground">{service.active_contracts} contratos ativos</p>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(service.monthly_revenue)}/mês</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Due Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDates.length > 0 ? upcomingDates.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.client_name}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      item.days_until <= 3 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      Vence em {item.days_until} {item.days_until === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(item.valor_final)}</div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum vencimento próximo</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inadimplência Alert */}
      {delinquentClients.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Atenção: Clientes Inadimplentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {delinquentClients.map((client: any, i: number) => (
                <div key={i} className="flex flex-col p-3 border rounded-md bg-card">
                  <span className="text-sm font-bold truncate">{client.client_name}</span>
                  <span className="text-xs text-muted-foreground">{client.overdue_count} faturas atrasadas</span>
                  <span className="text-sm font-bold text-destructive mt-1">{formatCurrency(client.total_overdue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema</CardTitle>
          <CardDescription>
            Seu ambiente de gestão e cobranças está pronto para uso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acompanhe aqui o desempenho financeiro da sua empresa em tempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
