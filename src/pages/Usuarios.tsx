import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Users, 
  UserCheck, 
  Plus,
  Shield,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  ldap_id: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export default function Usuarios() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    senha: "",
    role: "user" as "admin" | "user"
  });

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUsuarios();
    } else if (!authLoading && !isAdmin) {
      setLoading(false);
    }
  }, [isAdmin, authLoading]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usuarios:', error);
        setError('Erro ao carregar usuários');
        return;
      }

      setUsuarios(data || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Erro inesperado ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.senha) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (newUser.senha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://bqwaasdjpxlucgsknryp.supabase.co/functions/v1/manage-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            action: 'create',
            nome: newUser.nome,
            email: newUser.email,
            senha: newUser.senha,
            role: newUser.role
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erro ao criar usuário");
        return;
      }

      toast.success("Usuário criado com sucesso");
      setDialogOpen(false);
      setNewUser({ nome: "", email: "", senha: "", role: "user" });
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erro inesperado ao criar usuário");
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error("Por favor, preencha a nova senha");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://bqwaasdjpxlucgsknryp.supabase.co/functions/v1/manage-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            action: 'update_password',
            email: selectedUser.email,
            senha: newPassword
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erro ao atualizar senha");
        return;
      }

      toast.success("Senha atualizada com sucesso");
      setEditDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erro inesperado ao atualizar senha");
    }
  };

  // Show access denied for non-admin users
  if (!authLoading && !isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários e suas responsabilidades
            </p>
          </div>
        </div>
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem visualizar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários e suas responsabilidades
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  // Show error if occurred
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários e suas responsabilidades
            </p>
          </div>
        </div>
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.ldap_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usuariosAtivos = usuarios.length; // All users in DB are considered active
  const totalAdmins = usuarios.filter(u => u.role === 'admin').length;
  const totalUsers = usuarios.filter(u => u.role === 'user').length;

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
        <Button className="shadow-primary" onClick={() => setDialogOpen(true)}>
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
                <UserCheck className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-warning">{totalAdmins}</p>
              </div>
              <div className="w-12 h-12 bg-warning-light rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Padrão</p>
                <p className="text-2xl font-bold text-info">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-info-light rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-info" />
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
                  <TableHead>Role</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {usuario.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{usuario.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell className="font-mono text-sm">{usuario.ldap_id}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'}>
                        {usuario.role === 'admin' ? (
                          <><ShieldCheck className="w-3 h-3 mr-1" /> Admin</>
                        ) : (
                          <><Shield className="w-3 h-3 mr-1" /> Usuário</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(usuario);
                          setEditDialogOpen(true);
                        }}
                      >
                        Alterar Senha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para criar usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={newUser.nome}
                onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={newUser.senha}
                onChange={(e) => setNewUser({ ...newUser, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: "admin" | "user") => 
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para alterar senha */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Alterar senha de {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova Senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setSelectedUser(null);
              setNewPassword("");
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePassword}>
              Atualizar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}