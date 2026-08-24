import { createFileRoute } from "@tanstack/react-router";
import { useServices } from "@/hooks/use-services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Briefcase, Edit, Eye } from "lucide-react";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { services, loading } = useServices();

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Catálogo de Serviços
        </h1>
        <Button className="gap-2">
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
                <Button variant="ghost" size="icon" className="h-9 w-9">
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
    </div>
  );
}
