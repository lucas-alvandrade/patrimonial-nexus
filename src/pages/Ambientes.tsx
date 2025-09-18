import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  Users,
  Upload
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Ambientes() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAmbientes = async () => {
    try {
      const { data, error } = await supabase
        .from('ambientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Error fetching ambientes:', error);
        return;
      }

      setAmbientes(data || []);
    } catch (error) {
      console.error('Error fetching ambientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAmbiente = async (ambienteId: number, ambienteNome: string) => {
    try {
      const { error } = await supabase
        .from('ambientes')
        .delete()
        .eq('id', ambienteId);

      if (error) {
        console.error('Error deleting ambiente:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir ambiente. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Ambiente "${ambienteNome}" excluído com sucesso.`,
      });

      // Refresh the list
      fetchAmbientes();
    } catch (error) {
      console.error('Error deleting ambiente:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir ambiente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAmbientes();

      // Set up real-time subscription
      const channel = supabase
        .channel('ambientes-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ambientes'
          },
          () => {
            fetchAmbientes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Você não tem permissão para acessar esta página. Esta área é restrita a administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredAmbientes = ambientes.filter(ambiente =>
    ambiente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ambiente.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Ambientes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os ambientes e suas capacidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("upload")}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button className="shadow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Ambiente
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista de Ambientes</TabsTrigger>
          <TabsTrigger value="upload">Importar Arquivo</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buscar Ambientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou descrição do ambiente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Ambientes</p>
                    <p className="text-2xl font-bold text-foreground">{ambientes.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ambientes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Ambientes ({filteredAmbientes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Bloco</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAmbientes.map((ambiente) => (
                        <TableRow key={ambiente.id} className="hover:bg-muted/50 transition-smooth">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              {ambiente.nome}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {ambiente.bloco || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {ambiente.descricao}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o ambiente "{ambiente.nome}"? 
                                      Esta ação não pode ser desfeita e removerá o ambiente de todas as páginas.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAmbiente(ambiente.id, ambiente.nome)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <FileUpload 
            onUploadComplete={(results) => {
              console.log("Upload completed:", results);
              // Refresh data and switch back to list tab
              fetchAmbientes();
              setActiveTab("list");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}