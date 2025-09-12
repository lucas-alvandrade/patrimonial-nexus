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
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  Mail,
  IdCard
} from "lucide-react";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - em um app real, viria do banco de dados
  const usuarios = [
    {
      id: 1,
      nome: "João Silva",
      email: "joao.silva@empresa.com",
      ldap_id: "jsilva",
      bensAlocados: 3,
      ultimaAlocacao: "2024-01-15",
      status: "ativo"
    },
    {
      id: 2,
      nome: "Maria Santos",
      email: "maria.santos@empresa.com",
      ldap_id: "msantos",
      bensAlocados: 5,
      ultimaAlocacao: "2024-01-10",
      status: "ativo"
    },
    {
      id: 3,
      nome: "Carlos Oliveira",
      email: "carlos.oliveira@empresa.com",
      ldap_id: "coliveira",
      bensAlocados: 2,
      ultimaAlocacao: "2024-01-08",
      status: "ativo"
    },
    {
      id: 4,
      nome: "Ana Costa",
      email: "ana.costa@empresa.com",
      ldap_id: "acosta",
      bensAlocados: 4,
      ultimaAlocacao: "2024-01-12",
      status: "ativo"
    },
    {
      id: 5,
      nome: "Pedro Ferreira",
      email: "pedro.ferreira@empresa.com",
      ldap_id: "pferreira",
      bensAlocados: 1,
      ultimaAlocacao: "2024-01-05",
      status: "inativo"
    },
    {
      id: 6,
      nome: "Lucia Mendes",
      email: "lucia.mendes@empresa.com",
      ldap_id: "lmendes",
      bensAlocados: 0,
      ultimaAlocacao: null,
      status: "ativo"
    }
  ];

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.ldap_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usuariosAtivos = usuarios.filter(u => u.status === 'ativo').length;
  const totalBensAlocados = usuarios.reduce((sum, user) => sum + user.bensAlocados, 0);
  const usuariosComBens = usuarios.filter(u => u.bensAlocados > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários e suas responsabilidades
          </p>
        </div>
        <Button className="shadow-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email ou LDAP ID..."
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
                <p className="text-sm font-medium text-muted-foreground">Total Usuários</p>
                <p className="text-2xl font-bold text-foreground">{usuarios.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold text-success">{usuariosAtivos}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Bens Alocados</p>
                <p className="text-2xl font-bold text-foreground">{totalBensAlocados}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Com Responsabilidades</p>
                <p className="text-2xl font-bold text-warning">{usuariosComBens}</p>
              </div>
              <div className="w-12 h-12 bg-warning-light rounded-lg flex items-center justify-center">
                <IdCard className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários ({filteredUsuarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>LDAP ID</TableHead>
                  <TableHead>Bens Alocados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Alocação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        {usuario.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {usuario.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-muted-foreground" />
                        {usuario.ldap_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className={usuario.bensAlocados > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                          {usuario.bensAlocados}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.status === 'ativo' ? 'default' : 'secondary'}>
                        {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.ultimaAlocacao ? (
                        new Date(usuario.ultimaAlocacao).toLocaleDateString('pt-BR')
                      ) : (
                        <span className="text-muted-foreground">Nunca</span>
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