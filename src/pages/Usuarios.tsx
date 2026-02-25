import { useState, useEffect, useRef } from "react";
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
  Loader2,
  Upload,
  Pencil,
  FileSpreadsheet,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Create modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: "",
    senha: "",
    role: "user" as 'admin' | 'user'
  });

  // Edit modal state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState<{
    id: number;
    nome: string;
    senha: string;
    role: 'admin' | 'user';
  }>({ id: 0, nome: "", senha: "", role: "user" });

  // Batch upload state
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [batchPreview, setBatchPreview] = useState<{ nome: string; senha: string; papel: string }[]>([]);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);

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
      toast({ title: "Erro", description: "Nome e senha são obrigatórios", variant: "destructive" });
      return;
    }

    try {
      setIsCreating(true);
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('nome', newUser.nome.trim())
        .single();

      if (existingUser) {
        toast({ title: "Erro", description: "Já existe um usuário com este nome", variant: "destructive" });
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
        toast({ title: "Erro", description: "Erro ao criar usuário", variant: "destructive" });
        return;
      }

      toast({ title: "Sucesso", description: "Usuário criado com sucesso" });
      setIsDialogOpen(false);
      setNewUser({ nome: "", senha: "", role: "user" });
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erro", description: "Erro inesperado ao criar usuário", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async () => {
    if (!editUser.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    try {
      setIsEditing(true);

      const updateData: Record<string, string> = {
        nome: editUser.nome.trim(),
        role: editUser.role,
      };

      if (editUser.senha.trim()) {
        updateData.senha = editUser.senha;
      }

      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', editUser.id);

      if (error) {
        console.error('Error updating user:', error);
        toast({ title: "Erro", description: "Erro ao atualizar usuário", variant: "destructive" });
        return;
      }

      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso" });
      setIsEditDialogOpen(false);
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erro", description: "Erro inesperado ao atualizar usuário", variant: "destructive" });
    } finally {
      setIsEditing(false);
    }
  };

  const openEditDialog = (usuario: Usuario) => {
    setEditUser({
      id: usuario.id,
      nome: usuario.nome,
      senha: "",
      role: usuario.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) return;

    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', userId);
      if (error) {
        console.error('Error deleting user:', error);
        toast({ title: "Erro", description: "Erro ao excluir usuário", variant: "destructive" });
        return;
      }
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso" });
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erro", description: "Erro inesperado ao excluir usuário", variant: "destructive" });
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["nome", "senha", "papel"],
      ["exemplo_usuario", "senha123", "user"],
      ["exemplo_admin", "admin123", "admin"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuários");
    XLSX.writeFile(wb, "modelo_usuarios.xlsx");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        const errors: string[] = [];
        const validRows: { nome: string; senha: string; papel: string }[] = [];

        rows.forEach((row, idx) => {
          const nome = (row.nome || row.Nome || "").toString().trim();
          const senha = (row.senha || row.Senha || "").toString().trim();
          const papel = (row.papel || row.Papel || row.role || row.Role || "").toString().trim().toLowerCase();

          if (!nome) {
            errors.push(`Linha ${idx + 2}: nome ausente`);
            return;
          }
          if (!senha) {
            errors.push(`Linha ${idx + 2}: senha ausente`);
            return;
          }
          if (papel !== "admin" && papel !== "user") {
            errors.push(`Linha ${idx + 2}: papel inválido "${papel}" (use "admin" ou "user")`);
            return;
          }
          validRows.push({ nome, senha, papel });
        });

        setBatchErrors(errors);
        setBatchPreview(validRows);
        setIsBatchDialogOpen(true);
      } catch {
        toast({ title: "Erro", description: "Não foi possível ler o arquivo. Verifique o formato.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBatchUpload = async () => {
    if (batchPreview.length === 0) return;

    try {
      setIsUploading(true);

      const insertData = batchPreview.map((row) => ({
        nome: row.nome,
        senha: row.senha,
        role: row.papel as 'admin' | 'user',
        email: '',
        ldap_id: '',
      }));

      const { error } = await supabase.from('usuarios').insert(insertData);

      if (error) {
        console.error('Batch insert error:', error);
        toast({ title: "Erro", description: `Erro ao cadastrar em lote: ${error.message}`, variant: "destructive" });
        return;
      }

      toast({ title: "Sucesso", description: `${batchPreview.length} usuário(s) cadastrado(s) com sucesso` });
      setIsBatchDialogOpen(false);
      setBatchPreview([]);
      setBatchErrors([]);
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erro", description: "Erro inesperado ao cadastrar em lote", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Access denied
  if (!authLoading && !isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie todos os usuários e suas responsabilidades</p>
        </div>
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Acesso negado. Apenas administradores podem visualizar esta página.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie todos os usuários e suas responsabilidades</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie todos os usuários e suas responsabilidades</p>
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

  const totalAdmins = usuarios.filter(u => u.role === 'admin').length;
  const totalUsers = usuarios.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie todos os usuários e suas responsabilidades</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Modelo Excel
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileSelect}
          />
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
                <DialogDescription>Preencha os dados para criar um novo usuário no sistema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Usuário</Label>
                  <Input id="nome" placeholder="Digite o nome do usuário" value={newUser.nome} onChange={(e) => setNewUser(prev => ({ ...prev, nome: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" type="password" placeholder="Digite a senha" value={newUser.senha} onChange={(e) => setNewUser(prev => ({ ...prev, senha: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Papel</Label>
                  <Select value={newUser.role} onValueChange={(value: 'admin' | 'user') => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o papel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user"><div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Usuário</div></SelectItem>
                      <SelectItem value="admin"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Administrador</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Buscar Usuários</CardTitle></CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                <p className="text-2xl font-bold text-success">{usuarios.length}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
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
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
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
                <p className="text-2xl font-bold text-primary">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios Table */}
      <Card>
        <CardHeader><CardTitle>Lista de Usuários ({filteredUsuarios.length})</CardTitle></CardHeader>
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{usuario.nome.charAt(0).toUpperCase()}</span>
                          </div>
                          <span>{usuario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'}>
                          {usuario.role === 'admin' ? <><ShieldCheck className="w-3 h-3 mr-1" /> Admin</> : <><Shield className="w-3 h-3 mr-1" /> Usuário</>}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(usuario)} className="text-primary hover:text-primary hover:bg-primary/10">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(usuario.id, usuario.nome)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize os dados do usuário. Deixe a senha em branco para manter a atual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Usuário</Label>
              <Input id="edit-nome" value={editUser.nome} onChange={(e) => setEditUser(prev => ({ ...prev, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-senha">Nova Senha (opcional)</Label>
              <Input id="edit-senha" type="password" placeholder="Deixe em branco para manter" value={editUser.senha} onChange={(e) => setEditUser(prev => ({ ...prev, senha: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Papel</Label>
              <Select value={editUser.role} onValueChange={(value: 'admin' | 'user') => setEditUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user"><div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Usuário</div></SelectItem>
                  <SelectItem value="admin"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Administrador</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditUser} disabled={isEditing}>
              {isEditing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Upload Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Importação em Lote
            </DialogTitle>
            <DialogDescription>Confira os dados antes de confirmar o cadastro.</DialogDescription>
          </DialogHeader>

          {batchErrors.length > 0 && (
            <Alert className="border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Linhas com erro (ignoradas):</p>
                <ul className="list-disc list-inside text-sm">
                  {batchErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {batchPreview.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Senha</TableHead>
                    <TableHead>Papel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchPreview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{row.nome}</TableCell>
                      <TableCell className="text-muted-foreground">••••••</TableCell>
                      <TableCell>
                        <Badge variant={row.papel === 'admin' ? 'default' : 'secondary'}>
                          {row.papel === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum registro válido encontrado no arquivo.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsBatchDialogOpen(false); setBatchPreview([]); setBatchErrors([]); }}>Cancelar</Button>
            <Button onClick={handleBatchUpload} disabled={isUploading || batchPreview.length === 0}>
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cadastrando...</> : `Cadastrar ${batchPreview.length} usuário(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
