import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Calendar, Clock, DollarSign, Download, Eye, Printer, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/meus-contratos")({
  component: MeusContratosPage,
});

interface ClientEventContractData {
  eventId: string;
  eventTitle: string;
  eventType?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  contract?: {
    id: string;
    contractNumber: string;
    status: string;
    released: boolean;
    fileUrl?: string;
    totalAmount?: number;
  } | null;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

function MeusContratosPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClientEventContractData[]>([]);
  const [customerInfo, setCustomerInfo] = useState<{ name: string; email: string } | null>(null);
  const [selectedContractUrl, setSelectedContractUrl] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [activeContractClauses, setActiveContractClauses] = useState<string>("");
  const [activeContractNumber, setActiveContractNumber] = useState<string>("");

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const userEmail = session.user.email?.toLowerCase();
      const userId = session.user.id;

      // Buscar cliente associado ao email ou user_id
      let { data: clientData } = await supabase
        .from("clients" as any)
        .select("*")
        .eq("email", userEmail)
        .maybeSingle();

      if (!clientData) {
        const { data: clientByUser } = await supabase
          .from("clients" as any)
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        clientData = clientByUser;
      }

      if (!clientData) {
        setLoading(false);
        return;
      }

      setCustomerInfo({
        name: clientData.nome_razao_social || "Cliente",
        email: clientData.email || userEmail || ""
      });

      // Buscar eventos do cliente
      const { data: eventsData, error: eventsErr } = await supabase
        .from("events" as any)
        .select("*")
        .eq("customer_id", clientData.id)
        .order("start_date", { ascending: true });

      if (eventsErr) throw eventsErr;

      if (!eventsData || eventsData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const combined: ClientEventContractData[] = [];

      for (const ev of eventsData) {
        // Buscar contrato do evento
        const { data: contractData } = await supabase
          .from("contracts" as any)
          .select("*")
          .eq("event_id", ev.id)
          .maybeSingle();

        // Buscar pagamentos do evento
        const { data: paymentsData } = await supabase
          .from("invoices" as any)
          .select("*")
          .eq("event_id", ev.id);

        const payments = (paymentsData || []).map((p: any) => ({
          id: p.id,
          method: p.payment_method || p.forma_pagamento || "",
          amount: p.amount || p.valor || 0,
          status: p.status || "pendente",
          date: p.created_at || p.data || ""
        }));

        let contractInfo = null;
        if (contractData) {
          const isReleased = contractData.released === true || contractData.status === 'active' || contractData.status === 'signed' || contractData.status === 'liberado';
          if (isReleased) {
            contractInfo = {
              id: contractData.id,
              contractNumber: contractData.contract_number || "CTR-001",
              status: contractData.status,
              released: true,
              fileUrl: contractData.file_url || null,
              totalAmount: contractData.total_amount || 0,
              clauses: contractData.clauses || ""
            };
          }
        }

        combined.push({
          eventId: ev.id,
          eventTitle: ev.title || ev.nome || "Evento",
          eventType: ev.event_type || "Festa / Evento",
          startDate: ev.start_date || ev.data_inicio,
          endDate: ev.end_date || ev.data_fim,
          startTime: ev.start_time || ev.horario_inicio,
          endTime: ev.end_time || ev.horario_termino,
          status: ev.status || "CONFIRMED",
          contract: contractInfo,
          payments
        });
      }

      setItems(combined);
    } catch (err) {
      console.error("Erro ao carregar dados do cliente:", err);
      toast.error("Não foi possível carregar seus contratos.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (contract: NonNullable<ClientEventContractData['contract']> | null) => {
    if (!contract || !contract.released) {
      toast.error("Seu contrato ainda não foi disponibilizado pelo salão.");
      return;
    }
    setActiveContractClauses((contract as any).clauses || "Contrato liberado pelo Salão Santa Felicidade.");
    setActiveContractNumber(contract.contractNumber);
    setViewModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMethod = (m: string) => {
    if (!m) return "Forma de pagamento não informada.";
    const lower = m.toLowerCase();
    if (lower.includes("pix")) return "Pix";
    if (lower.includes("dinheiro")) return "Dinheiro";
    if (lower.includes("credito") || lower.includes("credit")) return "Cartão de crédito";
    if (lower.includes("debito") || lower.includes("debit")) return "Cartão de débito";
    if (lower.includes("cheque")) return "Cheque";
    if (lower.includes("transfer")) return "Transferência bancária";
    return m;
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus Contratos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize seus eventos, contratos liberados e o status dos pagamentos registrados.
            </p>
          </div>
          {customerInfo && (
            <div className="bg-card border rounded-lg px-4 py-2.5 text-sm">
              <p className="font-medium text-foreground">{customerInfo.name}</p>
              <p className="text-xs text-muted-foreground">{customerInfo.email}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando seus eventos e contratos...</p>
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Você ainda não possui eventos vinculados à sua conta.</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Assim que um agendamento for confirmado pelo salão e vinculado ao seu cadastro, ele aparecerá aqui com seu respectivo contrato.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => (window.location.href = "/disponibilidade")}>
                Consultar disponibilidade de datas
              </Button>
            </CardContent>
          </Card> 
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {items.map((item, index) => {
              const startDateFormatted = item.startDate ? new Date(item.startDate).toLocaleDateString('pt-BR') : "Data não informada";
              const endDateFormatted = item.endDate ? new Date(item.endDate).toLocaleDateString('pt-BR') : null;
              const hasDifferentEndDate = endDateFormatted && endDateFormatted !== startDateFormatted;

              return (
                <Card key={item.eventId || index} className="border shadow-sm">
                  <CardHeader className="bg-muted/30 border-b pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold">{item.eventTitle}</CardTitle>
                          <Badge variant="secondary" className="text-xs uppercase">
                            {item.eventType}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1 flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Início: {startDateFormatted} {item.startTime ? `às ${item.startTime}` : ""}
                          </span>
                          {hasDifferentEndDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Término: {endDateFormatted} {item.endTime ? `às ${item.endTime}` : ""}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={item.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-primary/10 text-primary'}>
                        {item.status === 'CONFIRMED' ? 'Confirmado' : item.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Seção do Contrato */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> Contrato do Evento
                      </h4>
                      {item.contract && item.contract.released ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-lg gap-4">
                          <div>
                            <p className="font-medium text-sm">Contrato #{item.contract.contractNumber}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Disponibilizado e liberado pelo salão</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewContract(item.contract)} className="gap-1.5">
                              <Eye className="h-3.5 w-3.5" /> Visualizar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewContract(item.contract)} className="gap-1.5">
                              <Download className="h-3.5 w-3.5" /> Baixar PDF
                            </Button>
                            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
                              <Printer className="h-3.5 w-3.5" /> Imprimir
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted/50 border rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>Seu contrato ainda não foi disponibilizado pelo salão.</span>
                        </div>
                      )}
                    </div>

                    {/* Seção de Pagamentos */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" /> Pagamentos Registrados
                      </h4>
                      {item.payments.length === 0 ? (
                        <div className="p-4 bg-muted/50 border rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>Nenhum pagamento confirmado até o momento.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.payments.map((pay, pIdx) => (
                            <div key={pay.id || pIdx} className="p-3.5 border rounded-lg bg-card space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Registro #{pIdx + 1}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${pay.status === 'paga' || pay.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                  {pay.status === 'paga' || pay.status === 'paid' ? 'Confirmado' : pay.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-foreground">
                                Formato: {formatMethod(pay.method)}
                              </p>
                              {pay.amount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Valor: R$ {Number(pay.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de Visualização do Contrato do Cliente */}
        {viewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white text-black p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 font-serif">
              <div className="text-center border-b pb-3">
                <h2 className="text-lg font-bold uppercase">SALÃO SANTA FELICIDADE - MEU CONTRATO</h2>
                <p className="text-xs text-gray-600">Contrato nº {activeContractNumber}</p>
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                {activeContractClauses}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => window.print()} className="gap-1"><Printer className="h-4 w-4" /> Imprimir</Button>
                <Button onClick={() => setViewModalOpen(false)}>Fechar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
