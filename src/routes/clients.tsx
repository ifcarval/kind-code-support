import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Users, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { clients, loading, fetchClients, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      const { error } = await deleteClient(id);
      if (error) {
        toast.error("Erro ao excluir cliente: " + error.message);
      } else {
        toast.success("Cliente excluído com sucesso.");
      }
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, any> = {
      ativo: "success",
      inativo: "secondary",
      bloqueado: "destructive",
      prospect: "outline",
    };
    return <Badge variant={variants[status || ""] || "default"}>{status || "N/A"}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Clientes
        </h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <CardTitle>Listagem de Clientes</CardTitle>
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar clientes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Buscar</Button>
              <Button type="button" variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </form>
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
                  <TableHead>Nome / Razão Social</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div>{client.nome_razao_social}</div>
                      {client.nome_fantasia && (
                        <div className="text-xs text-muted-foreground">{client.nome_fantasia}</div>
                      )}
                    </TableCell>
                    <TableCell>{client.cpf_cnpj || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{client.email}</div>
                      <div className="text-xs text-muted-foreground">{client.telefone}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Visualizar Detalhes"
                          onClick={() => navigate({ to: `/clients/${client.id}` })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive" 
                          title="Excluir"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente encontrado.
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
