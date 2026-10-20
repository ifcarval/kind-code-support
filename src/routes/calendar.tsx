import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useEvents, EventItem } from "@/hooks/use-events";
import { useClients } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Loader2, Plus, Eye, Edit, XCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { events, loading, createEvent, updateEvent, cancelEvent } = useEvents();
  const { clients } = useClients();
  const { profile } = useProfile();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    event_type: "Casamento",
    status: "QUOTE" as EventItem['status'],
    customer_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    start_time: "14:00",
    end_time: "22:00",
    guests: 100,
    total_value: 0,
    signal_value: 0,
    notes: ""
  });

  const handleSelectDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setEditingId(null);
    setFormData({
      title: "",
      event_type: "Casamento",
      status: "QUOTE",
      customer_id: "",
      start_date: dateStr,
      end_date: dateStr,
      start_time: "14:00",
      end_time: "22:00",
      guests: 100,
      total_value: 0,
      signal_value: 0,
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setFormData({
      title: ev.title,
      event_type: ev.event_type || "",
      status: ev.status,
      customer_id: ev.customer_id || "",
      start_date: ev.start_date,
      end_date: ev.end_date || ev.start_date,
      start_time: ev.start_time || "",
      end_time: ev.end_time || "",
      guests: ev.guests || 0,
      total_value: ev.total_value || 0,
      signal_value: ev.signal_value || 0,
      notes: ev.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleView = (ev: EventItem) => {
    setSelectedEvent(ev);
    setIsViewModalOpen(true);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado.");
        setIsSaving(false);
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from("organization_members" as any)
        .select("organization_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !memberData || !(memberData as any).organization_id) {
        toast.error("Usuário sem organização vinculada.");
        setIsSaving(false);
        return;
      }

      const orgId = (memberData as any).organization_id;

      const payload = {
        ...formData,
        organization_id: orgId,
        customer_id: formData.customer_id || null,
        start_date: formData.start_date ?? "",
        end_date: formData.end_date ?? ""
      };

      let res;
      if (editingId) {
        res = await updateEvent(editingId, payload);
      } else {
        res = await createEvent(payload);
      }

      if (res.error) {
        toast.error("Erro ao salvar evento: " + res.error.message);
      } else {
        toast.success(editingId ? "Evento atualizado com sucesso!" : "Evento criado com sucesso!");
        setIsModalOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("Deseja cancelar este evento?")) {
      const { error } = await cancelEvent(id);
      if (error) toast.error("Erro ao cancelar: " + error.message);
      else toast.success("Evento cancelado.");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string, variant: any }> = {
      QUOTE: { label: "Orçamento", variant: "secondary" },
      RESERVED: { label: "Reservado", variant: "default" },
      CONFIRMED: { label: "Confirmado", variant: "default" },
      IN_PROGRESS: { label: "Em Andamento", variant: "default" },
      COMPLETED: { label: "Concluído", variant: "outline" },
      CANCELLED: { label: "Cancelado", variant: "destructive" }
    };
    const info = map[status] || { label: status, variant: "secondary" };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  const dayEvents = date ? events.filter(e => {
    try {
      return isSameDay(parseISO(e.start_date), date);
    } catch {
      return false;
    }
  }) : [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📅 Calendário de Eventos
          </h1>
          <Button onClick={() => handleSelectDate(date || new Date())} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Evento na Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Selecionar Data</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleSelectDate}
                  locale={ptBR}
                  className="rounded-md border"
                />
              )}
            </CardContent>
          </Card> 

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                Eventos para {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionada"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dayEvents.map(ev => (
                  <div 
                    key={ev.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleView(ev)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{ev.title}</span>
                        {getStatusBadge(ev.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ev.customer?.nome_razao_social || "Cliente não informado"} • {ev.event_type || "Evento"} • {ev.start_time || "--:--"}
                      </p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" title="Visualizar" onClick={() => handleView(ev)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => handleOpenEdit(ev)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {ev.status !== 'CANCELLED' && (
                        <Button variant="ghost" size="icon" className="text-destructive" title="Cancelar" onClick={() => handleCancel(ev.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhum evento agendado para esta data.</p>
                    <Button variant="link" onClick={() => handleSelectDate(date)}>Criar evento nesta data</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Evento" : "Novo Evento"}</DialogTitle>
              <DialogDescription>Preencha os dados do evento ou locação.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Título do Evento</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Casamento Ana e João"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de Evento</Label>
                  <Input 
                    value={formData.event_type}
                    onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                    placeholder="Ex: Casamento, Aniversário"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Select value={formData.customer_id} onValueChange={(v) => setFormData({...formData, customer_id: v})}>
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
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUOTE">Orçamento</SelectItem>
                      <SelectItem value="RESERVED">Reservado</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                      <SelectItem value="COMPLETED">Concluído</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Data de Início</Label>
                  <Input 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Término</Label>
                  <Input 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Hora Início</Label>
                  <Input 
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora Término</Label>
                  <Input 
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nº Convidados</Label>
                  <Input 
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor Total</Label>
                  <CurrencyInput 
                    value={formData.total_value}
                    onChange={(v) => setFormData({...formData, total_value: v})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sinal / Entrada</Label>
                  <CurrencyInput 
                    value={formData.signal_value}
                    onChange={(v) => setFormData({...formData, signal_value: v})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Evento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
              <DialogDescription>{selectedEvent?.event_type || "Detalhes do Evento"}</DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{getStatusBadge(selectedEvent.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{selectedEvent.customer?.nome_razao_social || "Não informado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{format(new Date(selectedEvent.start_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário:</span>
                  <span>{selectedEvent.start_time || "--:--"} até {selectedEvent.end_time || "--:--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convidados:</span>
                  <span>{selectedEvent.guests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-bold">{formatCurrency(selectedEvent.total_value || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sinal:</span>
                  <span>{formatCurrency(selectedEvent.signal_value || 0)}</span>
                </div>
                {selectedEvent.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block mb-1">Observações:</span>
                    <p className="bg-muted p-2 rounded text-xs whitespace-pre-wrap">{selectedEvent.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => {
                setIsViewModalOpen(false);
                if (selectedEvent) handleOpenEdit(selectedEvent);
              }}>Editar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}