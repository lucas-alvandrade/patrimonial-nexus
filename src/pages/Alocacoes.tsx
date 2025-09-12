import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  Building2,
  Users,
  Calendar
} from "lucide-react";

export default function Alocacoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAmbiente, setSelectedAmbiente] = useState("all");

  // Mock data - em um app real, viria do banco de dados
  const alocacoes = [
    {
      id: 1,
      bem: {
        numero_patrimonio: "PAT001234",
        descricao: "Notebook Dell Latitude 5520"
      },
      ambiente: "Sala 101",
      usuario: "João Silva",
      data_registro: "2024-01-15T10:30:00Z",
      status: "ativa"
    },
    {
      id: 2,
      bem: {
        numero_patrimonio: "PAT001235",
        descricao: "Monitor LG 24' 4K"
      },
      ambiente: "Sala 102",
      usuario: "Maria Santos",
      data_registro: "2024-01-10T14:20:00Z",
      status: "ativa"
    },
    {
      id: 3,
      bem: {
        numero_patrimonio: "PAT001237",
        descricao: "Cadeira Ergonômica Presidente"
      },
      ambiente: "Sala 103",
      usuario: "Carlos Oliveira",
      data_registro: "2024-01-08T09:15:00Z",
      status: "ativa"
    },
    {
      id: 4,
      bem: {
        numero_patrimonio: "PAT001238",
        descricao: "Mesa de Escritório 120x60cm"
      },
      ambiente: "Sala 104",
      usuario: "Ana Costa",
      data_registro: "2024-01-12T16:45:00Z",
      status: "ativa"
    },
    {
      id: 5,
      bem: {
        numero_patrimonio: "PAT001240",
        descricao: "Projetor Epson PowerLite"
      },
      ambiente: "Auditório",
      usuario: "Pedro Ferreira",
      data_registro: "2024-01-05T11:00:00Z",
      status: "finalizada"
    }
  ];

  const ambientes = ["Sala 101", "Sala 102", "Sala 103", "Sala 104", "Auditório", "Laboratório", "Depósito"];

  const filteredAlocacoes = alocacoes.filter(alocacao => {
    const matchesSearch = alocacao.bem.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alocacao.bem.numero_patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alocacao.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAmbiente = selectedAmbiente === "all" || alocacao.ambiente === selectedAmbiente;
    return matchesSearch && matchesAmbiente;
  });

  const alocacoesAtivas = alocacoes.filter(a => a.status === 'ativa').length;
  const totalAlocacoes = alocacoes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Alocações</h1>
          <p className="text-muted-foreground">
            Gerencie a alocação de bens nos ambientes e responsáveis
          </p>
        </div>
        <Button className="shadow-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nova Alocação
        </Button>
      </div>

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
                  placeholder="Buscar por bem, patrimônio ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedAmbiente} onValueChange={setSelectedAmbiente}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ambientes</SelectItem>
                {ambientes.map((ambiente) => (
                  <SelectItem key={ambiente} value={ambiente}>
                    {ambiente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alocações</p>
                <p className="text-2xl font-bold text-foreground">{totalAlocacoes}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alocações Ativas</p>
                <p className="text-2xl font-bold text-success">{alocacoesAtivas}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ambientes Utilizados</p>
                <p className="text-2xl font-bold text-foreground">{new Set(alocacoes.map(a => a.ambiente)).size}</p>
              </div>
              <div className="w-12 h-12 bg-secondary-light rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold text-warning">{new Set(alocacoes.filter(a => a.status === 'ativa').map(a => a.usuario)).size}</p>
              </div>
              <div className="w-12 h-12 bg-warning-light rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alocacoes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alocações ({filteredAlocacoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bem</TableHead>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data Alocação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlocacoes.map((alocacao) => (
                  <TableRow key={alocacao.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        {alocacao.bem.descricao}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {alocacao.bem.numero_patrimonio}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {alocacao.ambiente}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {alocacao.usuario}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(alocacao.data_registro).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={alocacao.status === 'ativa' ? 'default' : 'secondary'}>
                        {alocacao.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                      </Badge>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}