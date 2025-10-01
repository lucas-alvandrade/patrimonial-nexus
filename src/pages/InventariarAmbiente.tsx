import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Building2, Plus, Trash2, ArrowLeft, CheckCircle, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InventarioItem {
  id?: string;
  patrimonio: string;
  descricao: string;
  situacao: 'Bom' | 'Inservível';
}

interface Ambiente {
  id: number;
  nome: string;
  descricao?: string;
}

export default function InventariarAmbiente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [ambiente, setAmbiente] = useState<Ambiente | null>(location.state?.ambiente || null);
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [currentItem, setCurrentItem] = useState<InventarioItem>({
    patrimonio: '',
    descricao: '',
    situacao: 'Bom'
  });
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [descricoes, setDescricoes] = useState<string[]>([]);
  const [openDescricao, setOpenDescricao] = useState(false);
  const [inventarioId, setInventarioId] = useState<number | null>(null);
  const [isConcluido, setIsConcluido] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConcluirDialog, setShowConcluirDialog] = useState(false);
  const [showDesbloquearDialog, setShowDesbloquearDialog] = useState(false);
  
  const patrimonioRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ambiente && id) {
      fetchAmbiente();
    }
    fetchDescricoes();
    checkAdminStatus();
    if (id) {
      fetchOrCreateInventario();
    }
  }, [id, ambiente]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchOrCreateInventario = async () => {
    try {
      // Buscar inventário existente
      let { data: inventario, error } = await supabase
        .from('inventarios')
        .select('*')
        .eq('ambiente_id', Number(id))
        .maybeSingle();

      if (error) throw error;

      // Se não existe, criar um novo
      if (!inventario) {
        const { data: newInventario, error: createError } = await supabase
          .from('inventarios')
          .insert({ ambiente_id: Number(id) })
          .select()
          .single();

        if (createError) throw createError;
        inventario = newInventario;
      }

      setInventarioId(inventario.id);
      setIsConcluido(inventario.status === 'concluido');

      // Buscar itens do inventário
      const { data: itensData, error: itensError } = await supabase
        .from('inventario_itens')
        .select('*')
        .eq('inventario_id', inventario.id);

      if (itensError) throw itensError;

      if (itensData && itensData.length > 0) {
        const mappedItems = itensData.map(item => ({
          id: item.id.toString(),
          patrimonio: item.patrimonio,
          descricao: item.descricao,
          situacao: item.situacao as 'Bom' | 'Inservível'
        }));
        setItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching inventario:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar inventário",
        variant: "destructive",
      });
    }
  };

  const fetchDescricoes = async () => {
    try {
      const { data, error } = await supabase
        .from('bens')
        .select('descricao')
        .order('descricao');

      if (error) throw error;
      
      // Extrair descrições únicas
      const uniqueDescricoes = [...new Set(data?.map(b => b.descricao).filter(Boolean) as string[])];
      setDescricoes(uniqueDescricoes);
    } catch (error) {
      console.error('Error fetching descricoes:', error);
    }
  };

  const fetchAmbiente = async () => {
    try {
      const { data, error } = await supabase
        .from('ambientes')
        .select('*')
        .eq('id', Number(id))
        .single();

      if (error) throw error;
      setAmbiente(data);
    } catch (error) {
      console.error('Error fetching ambiente:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ambiente",
        variant: "destructive",
      });
    }
  };

  const buscarBemPorPatrimonio = async (numeroPatrimonio: string) => {
    try {
      const { data, error } = await supabase
        .from('bens')
        .select('numero_patrimonio, descricao')
        .eq('numero_patrimonio', numeroPatrimonio)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bem:', error);
      return null;
    }
  };

  const handlePatrimonioKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && currentItem.patrimonio.trim()) {
      e.preventDefault();
      
      const bem = await buscarBemPorPatrimonio(currentItem.patrimonio.trim());
      
      if (bem && bem.descricao) {
        // Bem encontrado - preencher descrição e cadastrar automaticamente
        const newItem: InventarioItem = {
          id: Math.random().toString(36).substr(2, 9),
          patrimonio: currentItem.patrimonio,
          descricao: bem.descricao,
          situacao: currentItem.situacao
        };
        
        setItems([...items, newItem]);
        setCurrentItem({
          patrimonio: '',
          descricao: '',
          situacao: 'Bom'
        });
        
        toast({
          title: "Sucesso",
          description: "Item adicionado ao inventário",
        });
        
        // Focar novamente no campo patrimônio para próxima entrada
        setTimeout(() => patrimonioRef.current?.focus(), 0);
      } else {
        // Bem não encontrado - mover para campo descrição
        descricaoRef.current?.focus();
      }
    }
  };

  const handleCadastrar = async () => {
    if (!currentItem.patrimonio.trim() || !currentItem.descricao.trim()) {
      toast({
        title: "Atenção",
        description: "Preencha o patrimônio e a descrição",
        variant: "destructive",
      });
      return;
    }

    if (isConcluido) {
      toast({
        title: "Atenção",
        description: "Este inventário já foi concluído",
        variant: "destructive",
      });
      return;
    }

    try {
      // Salvar no banco de dados
      const { data: itemData, error: itemError } = await supabase
        .from('inventario_itens')
        .insert({
          inventario_id: inventarioId,
          patrimonio: currentItem.patrimonio,
          descricao: currentItem.descricao,
          situacao: currentItem.situacao
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Atualizar status para "em_andamento" se for o primeiro item
      if (items.length === 0) {
        const { error: statusError } = await supabase
          .from('inventarios')
          .update({ status: 'em_andamento' })
          .eq('id', inventarioId);

        if (statusError) throw statusError;
      }

      const newItem: InventarioItem = {
        id: itemData.id.toString(),
        patrimonio: currentItem.patrimonio,
        descricao: currentItem.descricao,
        situacao: currentItem.situacao
      };

      setItems([...items, newItem]);
      setCurrentItem({
        patrimonio: '',
        descricao: '',
        situacao: 'Bom'
      });

      toast({
        title: "Sucesso",
        description: "Item adicionado ao inventário",
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive",
      });
    }
  };

  const handleExcluir = async () => {
    if (selectedItemIndex === null) {
      toast({
        title: "Atenção",
        description: "Selecione um item para excluir",
        variant: "destructive",
      });
      return;
    }

    if (isConcluido) {
      toast({
        title: "Atenção",
        description: "Este inventário já foi concluído",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemToDelete = items[selectedItemIndex];
      
      // Deletar do banco de dados
      const { error } = await supabase
        .from('inventario_itens')
        .delete()
        .eq('id', Number(itemToDelete.id));

      if (error) throw error;

      const newItems = items.filter((_, index) => index !== selectedItemIndex);
      setItems(newItems);
      setSelectedItemIndex(null);

      toast({
        title: "Sucesso",
        description: "Item removido do inventário",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive",
      });
    }
  };


  const handleConcluir = async () => {
    try {
      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar o ID do usuário na tabela usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('ldap_id', user.user_metadata.ldap_id)
        .single();

      if (userError) throw userError;

      // Atualizar status para concluído
      const { error } = await supabase
        .from('inventarios')
        .update({ 
          status: 'concluido',
          concluido_por: userData.id,
          concluido_em: new Date().toISOString()
        })
        .eq('id', inventarioId);

      if (error) throw error;

      setIsConcluido(true);
      setShowConcluirDialog(false);

      toast({
        title: "Sucesso",
        description: "Inventário concluído com sucesso!",
      });
    } catch (error) {
      console.error('Error concluding inventory:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir inventário",
        variant: "destructive",
      });
    }
  };

  const handleDesbloquear = async () => {
    try {
      // Atualizar status para em_andamento
      const { error } = await supabase
        .from('inventarios')
        .update({ 
          status: 'em_andamento',
          concluido_por: null,
          concluido_em: null
        })
        .eq('id', inventarioId);

      if (error) throw error;

      setIsConcluido(false);
      setShowDesbloquearDialog(false);

      toast({
        title: "Sucesso",
        description: "Inventário desbloqueado com sucesso!",
      });
    } catch (error) {
      console.error('Error unlocking inventory:', error);
      toast({
        title: "Erro",
        description: "Erro ao desbloquear inventário",
        variant: "destructive",
      });
    }
  };

  const handleVoltar = () => {
    navigate('/inventariar');
  };

  if (!ambiente) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Building2 className="h-4 w-4" />
            <span>Inventário de Ambiente</span>
          </div>
          <h1 className="text-3xl font-bold">{ambiente.nome}</h1>
          {ambiente.descricao && (
            <p className="text-muted-foreground mt-1">{ambiente.descricao}</p>
          )}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Item ao Inventário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="patrimonio">Patrimônio</Label>
                <Input
                  ref={patrimonioRef}
                  id="patrimonio"
                  value={currentItem.patrimonio}
                  onChange={(e) => setCurrentItem({...currentItem, patrimonio: e.target.value})}
                  onKeyDown={handlePatrimonioKeyDown}
                  placeholder="Número do patrimônio"
                  disabled={isConcluido}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <div className="relative">
                  <Input
                    ref={descricaoRef}
                    id="descricao"
                    value={currentItem.descricao}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrentItem({...currentItem, descricao: value});
                      if (value.length > 0) {
                        setOpenDescricao(true);
                      } else {
                        setOpenDescricao(false);
                      }
                    }}
                    onFocus={() => {
                      if (currentItem.descricao.length > 0) {
                        setOpenDescricao(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setOpenDescricao(false), 200);
                    }}
                    placeholder="Descrição do item"
                    autoComplete="off"
                    disabled={isConcluido}
                  />
                  {openDescricao && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-auto">
                      {descricoes
                        .filter(desc => 
                          desc.toLowerCase().includes(currentItem.descricao.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((descricao, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCurrentItem({...currentItem, descricao});
                              setOpenDescricao(false);
                            }}
                          >
                            {descricao}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="situacao">Situação</Label>
                <Select
                  value={currentItem.situacao}
                  onValueChange={(value: 'Bom' | 'Inservível') => 
                    setCurrentItem({...currentItem, situacao: value})
                  }
                  disabled={isConcluido}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bom">Bom</SelectItem>
                    <SelectItem value="Inservível">Inservível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleCadastrar} className="flex-1" disabled={isConcluido}>
                  Cadastrar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleExcluir}
                  disabled={selectedItemIndex === null || isConcluido}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Itens do Inventário</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum item adicionado ao inventário
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patrimônio</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer ${
                        selectedItemIndex === index ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedItemIndex(
                        selectedItemIndex === index ? null : index
                      )}
                    >
                      <TableCell className="font-medium">{item.patrimonio}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.situacao === 'Bom' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.situacao}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button 
            variant="success" 
            onClick={() => setShowConcluirDialog(true)}
            disabled={isConcluido || items.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluir
          </Button>
          {isAdmin && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDesbloquearDialog(true)}
              disabled={!isConcluido}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Desbloquear
            </Button>
          )}
        </div>

        <AlertDialog open={showConcluirDialog} onOpenChange={setShowConcluirDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Concluir Inventário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja concluir o inventário deste ambiente? Após concluído, não será mais possível adicionar novos itens.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConcluir}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDesbloquearDialog} onOpenChange={setShowDesbloquearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desbloquear Inventário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desbloquear este inventário? Isso permitirá adicionar novos itens novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDesbloquear}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}