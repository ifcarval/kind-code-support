import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useLandlords, LandlordItem } from "@/hooks/use-landlords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Users, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/landlords")({
  component: LandlordsPage,
});

function LandlordsPage() {
  const { landlords, loading, createLandlord, updateLandlord, deleteLandlord } = useLandlords();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    pix_key: "",
    notes: ""
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      document: "",
      email: "",
      phone: "",
      pix_key: "",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LandlordItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      document: item.document || "",
      email: item.email || "",
      phone: item.phone || "",
      pix_key: item.pix_key || "",
      notes: item.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    if (editingId) {
      res = await updateLandlord(editingId, formData);
    } else {
      res = await createLandlord(formData);
    }

    if (res.error) {
      toast.error("Erro ao salvar locador: " + res.error.message);
    } else {
      toast.success(editingId ? "Locador atualizado!" : "Locador cadastrado!");
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este locador?")) {
      const { error } = await deleteLandlord(id);
      if (error) toast.error("Erro ao excluir: " + error.message);
      else toast.success("Locador excluído.");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Dados do Locador (Tabela landlords)</h1>
          <Button onClick={handleOpenCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Locador</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Lista de Locadores</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento (CPF/CNPJ)</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Chave PIX</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {landlords.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.document || '-'}</TableCell>
                      <TableCell>{item.email || '-'}</TableCell>
                      <TableCell>{item.phone || '-'}</TableCell>
                      <TableCell>{item.pix_key || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Locador" : "Novo Locador"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome / Razão Social</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Documento (CPF/CNPJ)</Label>
                  <Input value={formData.document} onChange={(e) => setFormData({...formData, document: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Chave PIX</Label>
                  <Input value={formData.pix_key} onChange={(e) => setFormData({...formData, pix_key: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
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
