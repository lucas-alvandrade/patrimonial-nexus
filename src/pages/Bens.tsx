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
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin
} from "lucide-react";

export default function Bens() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCondicao, setSelectedCondicao] = useState("all");

  // Mock data - em um app real, viria do banco de dados
  const bens = [
    {
      id: 1,
      numero_patrimonio: "PAT001234",
      descricao: "Notebook Dell Latitude 5520 - Intel i7 8GB RAM",
      condicao: "bom",
      ambiente: "Sala 101",
      usuario: "João Silva"
    },
    {
      id: 2,
      numero_patrimonio: "PAT001235",
      descricao: "Monitor LG 24' 4K UltraHD",
      condicao: "bom",
      ambiente: "Sala 102",
      usuario: "Maria Santos"
    },
    {
      id: 3,
      numero_patrimonio: "PAT001236",
      descricao: "Impressora HP LaserJet Pro M404dn",
      condicao: "inservível",
      ambiente: "Depósito",
      usuario: null
    },
    {
      id: 4,
      numero_patrimonio: "PAT001237",
      descricao: "Cadeira Ergonômica Presidente",
      condicao: "bom",
      ambiente: "Sala 103",
      usuario: "Carlos Oliveira"
    },
    {
      id: 5,
      numero_patrimonio: "PAT001238",
      descricao: "Mesa de Escritório 120x60cm",
      condicao: "bom",
      ambiente: "Sala 104",
      usuario: "Ana Costa"
    }
  ];

  const filteredBens = bens.filter(bem => {
    const matchesSearch = bem.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bem.numero_patrimonio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondicao = selectedCondicao === "all" || bem.condicao === selectedCondicao;
    return matchesSearch && matchesCondicao;
  });

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
        <Button className="shadow-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Bem
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
                  placeholder="Buscar por descrição ou número patrimônio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCondicao} onValueChange={setSelectedCondicao}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Condição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas condições</SelectItem>
                <SelectItem value="bom">Bom</SelectItem>
                <SelectItem value="inservível">Inservível</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
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
                <p className="text-sm font-medium text-muted-foreground">Em Bom Estado</p>
                <p className="text-2xl font-bold text-success">{bens.filter(b => b.condicao === 'bom').length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Inservíveis</p>
                <p className="text-2xl font-bold text-destructive">{bens.filter(b => b.condicao === 'inservível').length}</p>
              </div>
              <div className="w-12 h-12 bg-destructive-light rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-destructive" />
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
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Condição</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBens.map((bem) => (
                  <TableRow key={bem.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      {bem.numero_patrimonio}
                    </TableCell>
                    <TableCell>{bem.descricao}</TableCell>
                    <TableCell>
                      <Badge variant={bem.condicao === 'bom' ? 'default' : 'destructive'}>
                        {bem.condicao === 'bom' ? 'Bom' : 'Inservível'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {bem.ambiente}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bem.usuario || (
                        <span className="text-muted-foreground">Não alocado</span>
                      )}
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