import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Users, Trash2 } from "lucide-react";

interface Usuario {
  id: number;
  nome: string;
  email: string | null;
}

interface Grupo {
  id: number;
  nome: string;
  created_at: string;
  usuarios: Usuario[];
}

export default function Grupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [formNome, setFormNome] = useState("");
  const [selectedUsuarios, setSelectedUsuarios] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar todos os usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, nome, email")
        .order("nome");

      if (usuariosError) throw usuariosError;
      setUsuarios(usuariosData || []);

      // Buscar todos os grupos
      const { data: gruposData, error: gruposError } = await supabase
        .from("grupos")
        .select("*")
        .order("nome");

      if (gruposError) throw gruposError;

      // Buscar relacionamentos grupos_usuarios
      const { data: gruposUsuariosData, error: guError } = await supabase
        .from("grupos_usuarios")
        .select("grupo_id, usuario_id");

      if (guError) throw guError;

      // Montar grupos com usuários
      const gruposComUsuarios: Grupo[] = (gruposData || []).map((grupo) => {
        const usuarioIds = (gruposUsuariosData || [])
          .filter((gu) => gu.grupo_id === grupo.id)
          .map((gu) => gu.usuario_id);
        
        const grupoUsuarios = (usuariosData || []).filter((u) =>
          usuarioIds.includes(u.id)
        );

        return {
          ...grupo,
          usuarios: grupoUsuarios,
        };
      });

      setGrupos(gruposComUsuarios);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingGrupo(null);
    setFormNome("");
    setSelectedUsuarios([]);
    setDialogOpen(true);
  };

  const openEditDialog = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setFormNome(grupo.nome);
    setSelectedUsuarios(grupo.usuarios.map((u) => u.id));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formNome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingGrupo) {
        // Atualizar grupo existente
        const { error: updateError } = await supabase
          .from("grupos")
          .update({ nome: formNome.trim() })
          .eq("id", editingGrupo.id);

        if (updateError) throw updateError;

        // Remover usuários antigos
        const { error: deleteError } = await supabase
          .from("grupos_usuarios")
          .delete()
          .eq("grupo_id", editingGrupo.id);

        if (deleteError) throw deleteError;

        // Adicionar novos usuários
        if (selectedUsuarios.length > 0) {
          const { error: insertError } = await supabase
            .from("grupos_usuarios")
            .insert(
              selectedUsuarios.map((usuarioId) => ({
                grupo_id: editingGrupo.id,
                usuario_id: usuarioId,
              }))
            );

          if (insertError) throw insertError;
        }

        toast({
          title: "Sucesso",
          description: "Grupo atualizado com sucesso",
        });
      } else {
        // Criar novo grupo
        const { data: newGrupo, error: createError } = await supabase
          .from("grupos")
          .insert({ nome: formNome.trim() })
          .select()
          .single();

        if (createError) throw createError;

        // Adicionar usuários ao grupo
        if (selectedUsuarios.length > 0 && newGrupo) {
          const { error: insertError } = await supabase
            .from("grupos_usuarios")
            .insert(
              selectedUsuarios.map((usuarioId) => ({
                grupo_id: newGrupo.id,
                usuario_id: usuarioId,
              }))
            );

          if (insertError) throw insertError;
        }

        toast({
          title: "Sucesso",
          description: "Grupo criado com sucesso",
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grupo: Grupo) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${grupo.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("grupos")
        .delete()
        .eq("id", grupo.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleUsuario = (usuarioId: number) => {
    setSelectedUsuarios((prev) =>
      prev.includes(usuarioId)
        ? prev.filter((id) => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grupos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os grupos de usuários do sistema
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Grupo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Grupos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : grupos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum grupo cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos.map((grupo) => (
                  <TableRow key={grupo.id}>
                    <TableCell className="font-medium">{grupo.nome}</TableCell>
                    <TableCell>
                      {grupo.usuarios.length === 0 ? (
                        <span className="text-muted-foreground">
                          Nenhum usuário
                        </span>
                      ) : (
                        <span>
                          {grupo.usuarios.map((u) => u.nome).join(", ")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(grupo)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(grupo)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar grupo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo ? "Editar Grupo" : "Criar Grupo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Grupo *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Digite o nome do grupo"
              />
            </div>

            <div className="space-y-2">
              <Label>Usuários</Label>
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {usuarios.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhum usuário cadastrado
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {usuarios.map((usuario) => (
                      <div
                        key={usuario.id}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                        onClick={() => toggleUsuario(usuario.id)}
                      >
                        <Checkbox
                          checked={selectedUsuarios.includes(usuario.id)}
                          onCheckedChange={() => toggleUsuario(usuario.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{usuario.nome}</div>
                          {usuario.email && (
                            <div className="text-sm text-muted-foreground">
                              {usuario.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedUsuarios.length} usuário(s) selecionado(s)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
