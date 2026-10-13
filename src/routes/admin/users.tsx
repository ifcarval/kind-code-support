import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Mail, Calendar, User, Building } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/users")({
  component: AdminGuard,
});

function AdminGuard() {
  const { isLifetimeAdmin, isLoading } = useProfile();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isLifetimeAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive flex justify-center mb-2">Acesso Restrito</CardTitle>
              <CardDescription>
                Esta área é exclusiva para o Administrador Vitalício do sistema.
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

  return <AdminUsersPage />;
}

function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          company:companies(*)
        `);

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'vitalicia':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Vitalícia</Badge>;
      case 'trial':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Demonstração</Badge>;
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Ativo</Badge>;
      default:
        return <Badge variant="secondary">{status || 'N/A'}</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Administração de Usuários</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos os Usuários (igor.carvalho76@gmail.com / Carval@26)</CardTitle>
            <CardDescription>
              Gerencie usuários, planos e permissões do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Assinatura</TableHead>
                      <TableHead>Expiração</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {u.nome}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {u.company?.nome || "Sem empresa"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {u.role === 'owner' ? 'Proprietário' : 'Usuário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(u.company?.subscription_status ?? null)}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(u.company?.trial_ends_at ?? null)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.created_at ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
