import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";

import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Users, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { clients, loading, fetchClients, deleteClient, createClient, updateClient } = useClients();
  const { profile, isOwner, isLoading: profileLoading } = useProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  if (!profileLoading && !isOwner) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive flex justify-center mb-2">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar a gestão de clientes. 
                Esta página é restrita a proprietários.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button onClick={() => navigate({ to: "/" })}>Voltar ao Início</Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>
    );
  }


  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    nome_razao_social: "",
    nome_fantasia: "",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    status: "ativo",
    tipo_pessoa: "J"
  });

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

  const handleOpenModal = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nome_razao_social: client.nome_razao_social || "",
        nome_fantasia: client.nome_fantasia || "",
        cpf_cnpj: client.cpf_cnpj || "",
        email: client.email || "",
        telefone: client.telefone || "",
        status: client.status || "ativo",
        tipo_pessoa: client.tipo_pessoa || "J"
      });
    } else {
      setEditingClient(null);
      setFormData({
        nome_razao_social: "",
        nome_fantasia: "",
        cpf_cnpj: "",
        email: "",
        telefone: "",
        status: "ativo",
        tipo_pessoa: "J"
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    const data = {
      ...formData,
      company_id: profile.company_id
    };

    let result;
    if (editingClient) {
      result = await updateClient(editingClient.id, data);
    } else {
      result = await createClient(data);
    }

    if (result.error) {
      toast.error("Erro ao salvar cliente: " + result.error.message);
    } else {
      toast.success(editingClient ? "Cliente atualizado!" : "Cliente criado!");
      setIsModalOpen(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, any> = {
      ativo: "default",
      inativo: "secondary",
      bloqueado: "destructive",
      prospect: "outline",
    };
    return <Badge variant={variants[status || ""] || "default"}>{status || "N/A"}</Badge>;
  };

  return (
    <AppLayout>

    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Clientes
        </h1>
        <Button className="gap-2" onClick={() => handleOpenModal()}>
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Editar"
                          onClick={() => handleOpenModal(client)}
                        >
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              Preencha os dados básicos do cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome / Razão Social</Label>
              <Input 
                id="nome" 
                value={formData.nome_razao_social} 
                onChange={(e) => setFormData({...formData, nome_razao_social: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">CPF / CNPJ</Label>
              <Input 
                id="documento" 
                value={formData.cpf_cnpj} 
                onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input 
                  id="telefone" 
                  value={formData.telefone} 
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select 
                  value={formData.tipo_pessoa} 
                  onValueChange={(v) => setFormData({...formData, tipo_pessoa: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="J">Jurídica (CNPJ)</SelectItem>
                    <SelectItem value="F">Física (CPF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}


