import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEvents, EventItem } from "@/hooks/use-events";
import { useClients } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Loader2, Calendar as CalendarIcon, Plus, Search, Edit, XCircle, Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/events")({
  component: EventsPage,
});

function EventsPage() {
  const { events, eventTypes, loading, createEvent, updateEvent, cancelEvent } = useEvents();
  const { clients } = useClients();
  const { profile } = useProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    event_type: "Casamento",
    event_type_id: "",
    custom_event_type: "",
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

  const handleOpenCreate = (defaultDate?: string) => {
    setEditingId(null);
    const defaultType = eventTypes.find(t => t.name === 'Casamento') || eventTypes[0];
    setFormData({
      title: "",
      event_type: defaultType?.name || "Casamento",
      event_type_id: defaultType?.id || "",
      custom_event_type: "",
      status: "QUOTE",
      customer_id: "",
      start_date: defaultDate || new Date().toISOString().split('T')[0],
      end_date: defaultDate || new Date().toISOString().split('T')[0],
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
    const matchedType = eventTypes.find(t => t.id === ev.event_type_id || t.name === ev.event_type);
    setFormData({
      title: ev.title,
      event_type: matchedType ? matchedType.name : (ev.event_type || "Casamento"),
      event_type_id: matchedType ? matchedType.id : (ev.event_type_id || ""),
      custom_event_type: ev.custom_event_type || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    const selectedTypeObj = eventTypes.find(t => t.id === formData.event_type_id);
    const finalEventTypeName = selectedTypeObj ? selectedTypeObj.name : formData.event_type;

    const payload = {
      title: formData.title,
      event_type: finalEventTypeName,
      event_type_id: formData.event_type_id || null,
      custom_event_type: finalEventTypeName === 'Outro' ? formData.custom_event_type : null,
      status: formData.status,
      customer_id: formData.customer_id || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      guests: formData.guests,
      total_value: formData.total_value,
      signal_value: formData.signal_value,
      notes: formData.notes,
      organization_id: profile.company_id
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
      toast.success(editingId ? "Evento atualizado!" : "Evento criado!");
      setIsModalOpen(false);
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

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.customer?.nome_razao_social?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Gestão de Eventos
          </h1>
          <Button onClick={() => handleOpenCreate()} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Evento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Eventos</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar evento ou cliente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Convidados</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map(ev => (
                    <TableRow key={ev.id} className="cursor-pointer" onClick={() => handleView(ev)}>
                      <TableCell className="font-medium">{ev.title}</TableCell>
                      <TableCell>{ev.customer?.nome_razao_social || "N/A"}</TableCell>
                      <TableCell>{ev.event_type || "N/A"}</TableCell>
                      <TableCell>{format(new Date(ev.start_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{ev.guests || 0}</TableCell>
                      <TableCell>{formatCurrency(ev.total_value || 0)}</TableCell>
                      <TableCell>{getStatusBadge(ev.status)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum evento encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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
                  <Select 
                    value={formData.event_type_id} 
                    onValueChange={(v) => {
                      const t = eventTypes.find(item => item.id === v);
                      setFormData({
                        ...formData, 
                        event_type_id: v, 
                        event_type: t ? t.name : formData.event_type
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de evento" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {Object.entries(
                        eventTypes.reduce((acc: Record<string, typeof eventTypes>, item) => {
                          if (!acc[item.category]) acc[item.category] = [];
                          acc[item.category].push(item);
                          return acc;
                        }, {})
                      ).map(([category, items]) => (
                        <div key={category} className="p-1">
                          <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                            {category}
                          </div>
                          {items.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.event_type === 'Outro' && (
                <div className="space-y-1.5">
                  <Label>Especifique o Tipo de Evento</Label>
                  <Input 
                    value={formData.custom_event_type}
                    onChange={(e) => setFormData({...formData, custom_event_type: e.target.value})}
                    placeholder="Digite o nome do evento..."
                    required
                  />
                </div>
              )}

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
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Evento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
