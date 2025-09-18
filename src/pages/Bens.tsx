import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Upload,
  DollarSign
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Bens() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [bens, setBens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchBens();
  }, []);

  const fetchBens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bens:', error);
        toast({
          title: "Erro",
          description: "Erro ao buscar bens. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setBens(data || []);
    } catch (error) {
      console.error('Error fetching bens:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBens = bens.filter(bem => {
    const matchesSearch = bem.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bem.numero_patrimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bem.setor_responsavel?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const valorTotal = bens.reduce((total, bem) => total + (parseFloat(bem.valor) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Bens</h1>
          <p className="text-muted-foreground">
            Gerencie todos os bens patrimoniais da organização
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("upload")}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button className="shadow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Bem
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista de Bens</TabsTrigger>
          <TabsTrigger value="upload">Importar Arquivo</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                     <Input
                       placeholder="Buscar por descrição, número ou setor responsável..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pl-10"
                     />
                   </div>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Bens</p>
                    <p className="text-2xl font-bold text-foreground">{bens.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total dos Bens</p>
                    <p className="text-2xl font-bold text-success">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(valorTotal)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success-light rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bens Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Bens ({filteredBens.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Carga Atual</TableHead>
                      <TableHead>Setor Responsável</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredBens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchTerm ? 'Nenhum bem encontrado com os filtros aplicados.' : 'Nenhum bem cadastrado.'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBens.map((bem) => (
                        <TableRow key={bem.id} className="hover:bg-muted/50 transition-smooth">
                          <TableCell className="font-medium">
                            {bem.numero_patrimonio}
                          </TableCell>
                          <TableCell>{bem.descricao || '-'}</TableCell>
                          <TableCell>{bem.carga_atual || '-'}</TableCell>
                          <TableCell>{bem.setor_responsavel || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {bem.valor ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(parseFloat(bem.valor)) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
              // Refresh the bens list and switch back to list tab
              fetchBens();
              setActiveTab("list");
              toast({
                title: "Upload concluído",
                description: `${results.successful || 0} bens importados com sucesso.`,
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}