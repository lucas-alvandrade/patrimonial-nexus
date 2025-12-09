import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Users, 
  UserCheck, 
  Plus,
  Shield,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Usuario {
  id: number;
  nome: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export default function Usuarios() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: "",
    senha: "",
    role: "user" as 'admin' | 'user'
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
        .select('id, nome, email, role, created_at, updated_at')
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
    if (!newUser.nome.trim() || !newUser.senha.trim()) {
      toast({
        title: "Erro",
        description: "Nome e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('nome', newUser.nome.trim())
        .single();

      if (existingUser) {
        toast({
          title: "Erro",
          description: "Já existe um usuário com este nome",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('usuarios')
        .insert({
          nome: newUser.nome.trim(),
          senha: newUser.senha,
          role: newUser.role,
          email: '',
          ldap_id: ''
        });

      if (error) {
        console.error('Error creating user:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar usuário",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso"
      });

      setIsDialogOpen(false);
      setNewUser({ nome: "", senha: "", role: "user" });
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar usuário",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir usuário",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso"
      });

      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir usuário",
        variant: "destructive"
      });
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
    (usuario.email && usuario.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const usuariosAtivos = usuarios.length;
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Usuário</Label>
                <Input
                  id="nome"
                  placeholder="Digite o nome do usuário"
                  value={newUser.nome}
                  onChange={(e) => setNewUser(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Digite a senha"
                  value={newUser.senha}
                  onChange={(e) => setNewUser(prev => ({ ...prev, senha: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Papel</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'admin' | 'user') => setNewUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Usuário
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              placeholder="Buscar por nome ou email..."
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
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
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
                <p className="text-2xl font-bold text-green-600">{usuariosAtivos}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-amber-600">{totalAdmins}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Padrão</p>
                <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
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
                  <TableHead>Papel</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {usuario.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span>{usuario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email || '-'}</TableCell>
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
                          onClick={() => handleDeleteUser(usuario.id, usuario.nome)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
