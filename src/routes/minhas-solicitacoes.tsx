import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEvents } from "@/hooks/use-events";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/minhas-solicitacoes")({
  component: MinhasSolicitacoesPage,
});

function MinhasSolicitacoesPage() {
  const { events, loading } = useEvents();
  const { profile } = useProfile();

  // Filtrar eventos criados pelo usuário logado ou mencionados no notes com seu email
  const userEmail = (profile?.email || "").toLowerCase();
  const userEvents = events.filter(e => {
    const notes = (e.notes || "").toLowerCase();
    return userEmail && notes.includes(userEmail);
  });

  const getFriendlyStatusBadge = (status: string) => {
    const map: Record<string, { label: string, variant: any }> = {
      QUOTE: { label: "Em análise", variant: "secondary" },
      RESERVED: { label: "Pré-reservado", variant: "default" },
      CONFIRMED: { label: "Confirmado", variant: "default" },
      IN_PROGRESS: { label: "Em andamento", variant: "default" },
      COMPLETED: { label: "Concluído", variant: "outline" },
      CANCELLED: { label: "Cancelado", variant: "destructive" }
    };
    const info = map[status] || { label: status, variant: "secondary" };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Minhas Solicitações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o status dos seus pedidos de reserva e orçamento no Salão Santa Felicidade.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Solicitações</CardTitle>
            <CardDescription>Eventos solicitados por você</CardDescription>
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
                    <TableHead>Tipo do Evento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Convidados</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userEvents.map(ev => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium">{ev.title}</TableCell>
                      <TableCell>{ev.event_type || "Evento"}</TableCell>
                      <TableCell>
                        {ev.start_date ? format(parseISO(ev.start_date), "dd/MM/yyyy", { locale: ptBR }) : "--"}
                      </TableCell>
                      <TableCell>{ev.start_time || "--:--"} às {ev.end_time || "--:--"}</TableCell>
                      <TableCell>{ev.guests || 0}</TableCell>
                      <TableCell>{getFriendlyStatusBadge(ev.status)}</TableCell>
                    </TableRow>
                  ))}
                  {userEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Você ainda não possui solicitações registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
