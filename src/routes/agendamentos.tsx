import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useEvents } from "@/hooks/use-events";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, ArrowRight, CreditCard } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/agendamentos")({
  component: AgendamentosPublicPage,
});

function AgendamentosPublicPage() {
  const { events, loading } = useEvents();
  const { session } = useProfile();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const getEventForDate = (d: Date) => {
    return events.find(e => {
      try {
        const matchesDate = isSameDay(parseISO(e.start_date), d);
        const isNotCancelled = e.status !== 'CANCELLED';
        return matchesDate && isNotCancelled;
      } catch {
        return false;
      }
    });
  };

  const dayEvent = date ? getEventForDate(date) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col">
      <div className="max-w-5xl mx-auto w-full space-y-6 flex-1">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <CalendarIcon className="h-6 w-6 text-purple-500" />
              Salão Santa Felicidade — Agendamentos
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Consulte a disponibilidade de datas e formas de pagamento aceitas.
            </p>
          </div>
          <div>
            {session ? (
              <Button onClick={() => navigate({ to: "/disponibilidade" })} className="bg-purple-600 hover:bg-purple-700 text-white">
                Ir para minha área
              </Button>
            ) : (
              <Button onClick={() => navigate({ to: "/login" })} className="bg-purple-600 hover:bg-purple-700 text-white">
                Entrar / Criar Conta
              </Button>
            )}
          </div>
        </div>

        {/* Formas de pagamento aceitas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Dinheiro', 'Cheque'].map((method) => (
            <div key={method} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-200">{method}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg text-white">Calendário Público</CardTitle>
              <CardDescription className="text-zinc-400">Selecione o dia desejado</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 my-12" />
              ) : (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={ptBR}
                  className="rounded-md border border-zinc-800 bg-zinc-950 text-white"
                  modifiers={{
                    occupied: (d) => {
                      const ev = getEventForDate(d);
                      return !!ev && ['CONFIRMED', 'RESERVED', 'IN_PROGRESS', 'COMPLETED'].includes(ev.status);
                    },
                    quote: (d) => {
                      const ev = getEventForDate(d);
                      return !!ev && ev.status === 'QUOTE';
                    }
                  }}
                  modifiersStyles={{
                    occupied: { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontWeight: 'bold' },
                    quote: { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15', fontWeight: 'bold' }
                  }}
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
              </CardTitle>
              <CardDescription className="text-zinc-400">Disponibilidade oficial do salão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {date && (
                <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-center space-y-4">
                  {dayEvent ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Indisponível / Ocupado</h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          Esta data possui evento ou solicitação registrada. Escolha outro período.
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs px-3 py-1 bg-zinc-800 text-zinc-300">
                        {dayEvent.status === 'QUOTE' ? 'Em análise / Orçamento' : 'Data ocupada'} 
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Disponível</h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          O salão está livre nesta data para reserva.
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          if (!session) {
                            navigate({ to: "/login" });
                          } else {
                            navigate({ to: "/disponibilidade" });
                          }
                        }} 
                        className="mt-2 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                      >
                        Continuar agendamento <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
