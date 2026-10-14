import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEvents, EventItem } from "@/hooks/use-events";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/disponibilidade")({
  component: DisponibilidadePage,
});

function DisponibilidadePage() {
  const { events, loading, createEvent } = useEvents();
  const { profile } = useProfile();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAvailableModalOpen, setIsAvailableModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  const [requestForm, setRequestForm] = useState({
    title: "",
    event_type: "Casamento",
    guests: 100,
    start_time: "14:00",
    end_time: "22:00",
    notes: ""
  });

  // Status que bloqueiam a data conforme regras
  // Status: RESERVED, CONFIRMED, IN_PROGRESS, COMPLETED, QUOTE (se orçamento bloquear)
  const blockedStatuses = ['RESERVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'QUOTE'];

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

  const handleSelectDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setSelectedDateStr(dateStr);

    const existing = getEventForDate(selectedDate);
    if (existing) {
      setIsAvailableModalOpen(true);
    } else {
      setRequestForm({
        title: `Evento de ${profile?.nome || "Cliente"}`,
        event_type: "Casamento",
        guests: 100,
        start_time: "14:00",
        end_time: "22:00",
        notes: ""
      });
      setIsRequestModalOpen(true);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id && !profile?.id) {
      toast.error("Perfil não carregado corretamente.");
      return;
    }

    // company_id padrão ou do perfil
    const companyId = profile?.company_id || "00000000-0000-0000-0000-000000000000";

    const payload = {
      organization_id: companyId,
      customer_id: null, // usuário externo
      title: requestForm.title || "Solicitação de Evento",
      event_type: requestForm.event_type,
      status: 'QUOTE' as const,
      start_date: selectedDateStr,
      end_date: selectedDateStr,
      start_time: requestForm.start_time,
      end_time: requestForm.end_time,
      guests: requestForm.guests,
      notes: `Solicitado por cliente externo (${profile?.email || ""}). ${requestForm.notes}`,
      total_value: 0,
      signal_value: 0
    };

    const { error } = await createEvent(payload);
    if (error) {
      toast.error("Erro ao enviar solicitação: " + error.message);
    } else {
      toast.success("Solicitação enviada com sucesso! O Master irá analisar.");
      setIsRequestModalOpen(false);
    }
  };

  const dayEvent = date ? getEventForDate(date) : null;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Datas Disponíveis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consulte o calendário do Salão Santa Felicidade e verifique a disponibilidade de datas para o seu evento.
          </p>
        </div>

        {/* Legenda visual */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-card">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
            <div className="text-xs">
              <span className="font-semibold block">Disponível</span>
              <span className="text-muted-foreground">Data livre</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-card">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
            <div className="text-xs">
              <span className="font-semibold block">Reservado / Em análise</span>
              <span className="text-muted-foreground">Pré-agendado</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-card">
            <div className="w-3.5 h-3.5 rounded-full bg-purple-600" />
            <div className="text-xs">
              <span className="font-semibold block">Ocupado</span>
              <span className="text-muted-foreground">Confirmado</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-card">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
            <div className="text-xs">
              <span className="font-semibold block">Indisponível</span>
              <span className="text-muted-foreground">Bloqueado</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendário</CardTitle>
              <CardDescription>Selecione uma data para verificar ou solicitar</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary my-12" />
              ) : (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleSelectDate}
                  locale={ptBR}
                  className="rounded-md border"
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
                    occupied: { backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontWeight: 'bold' },
                    quote: { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#ca8a04', fontWeight: 'bold' }
                  }}
                />
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
              </CardTitle>
              <CardDescription>Status de disponibilidade para a data selecionada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {date && (
                <div className="p-6 rounded-xl border bg-muted/30 flex flex-col items-center justify-center text-center space-y-4">
                  {dayEvent ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Indisponível / Ocupado</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Esta data já possui um evento agendado ou solicitação em andamento no salão.
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs px-3 py-1">
                        {dayEvent.status === 'QUOTE' ? 'Em análise / Orçamento' : 'Data ocupada'} 
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Esta data está disponível!</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          O salão está livre nesta data. Você pode solicitar o agendamento do seu evento.
                        </p>
                      </div>
                      <Button onClick={() => {
                        setRequestForm({
                          title: `Evento de ${profile?.nome || "Cliente"}`,
                          event_type: "Casamento",
                          guests: 100,
                          start_time: "14:00",
                          end_time: "22:00",
                          notes: ""
                        });
                        setIsRequestModalOpen(true);
                      }} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                        Solicitar esta data
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Solicitação de Data */}
        <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitar Reserva de Data</DialogTitle>
              <DialogDescription>
                Data desejada: {selectedDateStr ? format(parseISO(selectedDateStr), "dd/MM/yyyy", { locale: ptBR }) : ""}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Seu Nome</Label>
                  <Input value={profile?.nome || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input value={profile?.email || ""} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Título do Evento</Label>
                  <Input 
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                    placeholder="Ex: Casamento Ana e João"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo do Evento</Label>
                  <Input 
                    value={requestForm.event_type}
                    onChange={(e) => setRequestForm({...requestForm, event_type: e.target.value})}
                    placeholder="Ex: Casamento, Aniversário"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Horário Início</Label>
                  <Input 
                    type="time"
                    value={requestForm.start_time}
                    onChange={(e) => setRequestForm({...requestForm, start_time: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário Término</Label>
                  <Input 
                    type="time"
                    value={requestForm.end_time}
                    onChange={(e) => setRequestForm({...requestForm, end_time: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nº Convidados</Label>
                  <Input 
                    type="number"
                    value={requestForm.guests}
                    onChange={(e) => setRequestForm({...requestForm, guests: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea 
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                  placeholder="Detalhes adicionais ou pedidos especiais..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Solicitar esta data</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Data Indisponível */}
        <Dialog open={isAvailableModalOpen} onOpenChange={setIsAvailableModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Data Indisponível</DialogTitle>
              <DialogDescription>
                A data selecionada já está ocupada ou possui solicitação em andamento.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Por motivos de privacidade, os dados do evento de outros clientes não são exibidos publicamente.
              </p>
              <p className="font-semibold text-foreground">
                Status: Indisponível
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsAvailableModalOpen(false)}>Voltar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
