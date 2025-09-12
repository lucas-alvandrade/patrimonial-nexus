import { useState } from "react";
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

export default function Ambientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("list");

  // Mock data - em um app real, viria do banco de dados
  const ambientes = [
    {
      id: 1,
      nome: "Sala 101",
      descricao: "Sala de reuniões pequena - Térreo",
      totalBens: 12,
      bensAlocados: 10
    },
    {
      id: 2,
      nome: "Sala 102",
      descricao: "Escritório administrativo - Térreo",
      totalBens: 25,
      bensAlocados: 23
    },
    {
      id: 3,
      nome: "Sala 103",
      descricao: "Sala de desenvolvimento - 1º andar",
      totalBens: 35,
      bensAlocados: 35
    },
    {
      id: 4,
      nome: "Depósito",
      descricao: "Depósito geral de equipamentos",
      totalBens: 8,
      bensAlocados: 5
    },
    {
      id: 5,
      nome: "Auditório",
      descricao: "Auditório principal para eventos",
      totalBens: 45,
      bensAlocados: 42
    },
    {
      id: 6,
      nome: "Laboratório",
      descricao: "Laboratório de informática",
      totalBens: 30,
      bensAlocados: 28
    }
  ];

  const filteredAmbientes = ambientes.filter(ambiente =>
    ambiente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ambiente.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBensGeral = ambientes.reduce((sum, amb) => sum + amb.totalBens, 0);
  const totalAlocados = ambientes.reduce((sum, amb) => sum + amb.bensAlocados, 0);
  const percentualOcupacao = Math.round((totalAlocados / totalBensGeral) * 100);

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
          <div className="grid gap-4 md:grid-cols-4">
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacidade Total</p>
                    <p className="text-2xl font-bold text-foreground">{totalBensGeral}</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary-light rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-secondary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bens Alocados</p>
                    <p className="text-2xl font-bold text-success">{totalAlocados}</p>
                  </div>
                  <div className="w-12 h-12 bg-success-light rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa Ocupação</p>
                    <p className="text-2xl font-bold text-warning">{percentualOcupacao}%</p>
                  </div>
                  <div className="w-12 h-12 bg-warning-light rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-warning" />
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
                      <TableHead>Descrição</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Bens Alocados</TableHead>
                      <TableHead>Ocupação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAmbientes.map((ambiente) => {
                      const ocupacao = Math.round((ambiente.bensAlocados / ambiente.totalBens) * 100);
                      return (
                        <TableRow key={ambiente.id} className="hover:bg-muted/50 transition-smooth">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              {ambiente.nome}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {ambiente.descricao}
                          </TableCell>
                          <TableCell>{ambiente.totalBens}</TableCell>
                          <TableCell>{ambiente.bensAlocados}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    ocupacao >= 90 ? 'bg-destructive' :
                                    ocupacao >= 70 ? 'bg-warning' :
                                    'bg-success'
                                  }`}
                                  style={{ width: `${ocupacao}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{ocupacao}%</span>
                            </div>
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
                      );
                    })}
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
              // Optionally switch back to list tab and refresh data
              setActiveTab("list");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}