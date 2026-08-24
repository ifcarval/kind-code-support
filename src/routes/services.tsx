import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useServices } from "@/hooks/use-services";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Briefcase, Edit, Eye } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { services, loading, createService, updateService } = useServices();
  const { profile, isOwner, isLoading: profileLoading } = useProfile();

  if (!profileLoading && !isOwner) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive flex justify-center mb-2">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar o catálogo de serviços. 
                Esta página é restrita a proprietários.
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


  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    nome: "",
    descricao: "",
    valor_padrao: 0,
    tipo_cobranca: "mensal",
    categoria: "",
    ativo: true
  });

  const handleOpenModal = (service?: any) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nome: service.nome || "",
        descricao: service.descricao || "",
        valor_padrao: service.valor_padrao || 0,
        tipo_cobranca: service.tipo_cobranca || "mensal",
        categoria: service.categoria || "",
        ativo: service.ativo !== false
      });
    } else {
      setEditingService(null);
      setFormData({
        nome: "",
        descricao: "",
        valor_padrao: 0,
        tipo_cobranca: "mensal",
        categoria: "",
        ativo: true
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
    if (editingService) {
      result = await updateService(editingService.id, data);
    } else {
      result = await createService(data);
    }

    if (result.error) {
      toast.error("Erro ao salvar serviço: " + result.error.message);
    } else {
      toast.success(editingService ? "Serviço atualizado!" : "Serviço criado!");
      setIsModalOpen(false);
    }
  };

  const getStatusBadge = (ativo: boolean | null) => {
    return (
      <Badge variant={ativo ? "default" : "secondary"}>
        {ativo ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  const getPeriodicidadeLabel = (p: string) => {
    const map: Record<string, string> = {
      mensal: "Mensal",
      trimestral: "Trimestral",
      semestral: "Semestral",
      anual: "Anual",
      unico: "Único",
    };
    return map[p] || p;
  };

  return (
    <AppLayout>

    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Catálogo de Serviços
        </h1>
        <Button className="gap-2" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{service.nome}</CardTitle>
                  {getStatusBadge(service.ativo)}
                </div>
                <CardDescription className="line-clamp-2">
                  {service.descricao || "Sem descrição disponível."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(service.valor_padrao || 0)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {getPeriodicidadeLabel(service.tipo_cobranca || "")}
                  </span>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Categoria:</span>
                      <span className="font-medium">{service.categoria || "N/A"}</span>
                   </div>
                </div>
              </CardContent>
              <div className="p-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Eye className="h-4 w-4" />
                  Detalhes
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => handleOpenModal(service)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
        {!loading && services.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            Nenhum serviço cadastrado no catálogo.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            <DialogDescription>
              Defina as características do serviço oferecido.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Serviço</Label>
              <Input 
                id="nome" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea 
                id="descricao" 
                value={formData.descricao} 
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Padrão</Label>
                <Input 
                  id="valor" 
                  type="number"
                  step="0.01"
                  value={formData.valor_padrao} 
                  onChange={(e) => setFormData({...formData, valor_padrao: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Periodicidade</Label>
                <Select 
                  value={formData.tipo_cobranca} 
                  onValueChange={(v) => setFormData({...formData, tipo_cobranca: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="unico">Único / Setup</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input 
                  id="categoria" 
                  value={formData.categoria} 
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.ativo ? "ativo" : "inativo"} 
                  onValueChange={(v) => setFormData({...formData, ativo: v === "ativo"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
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


