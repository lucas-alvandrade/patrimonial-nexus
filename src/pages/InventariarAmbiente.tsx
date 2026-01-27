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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Plus, Trash2, ArrowLeft, Save, CheckCircle, Unlock, Camera, Clock, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "@/components/BarcodeScanner";

interface InventarioItem {
  id?: string;
  patrimonio: string;
  descricao: string;
  situacao: 'Bom' | 'Inservível';
  created_at?: string;
  inventariante?: string;
  duplicado?: string;
  tipo_cadastro?: 'A' | 'M';
}

interface Ambiente {
  id: number;
  nome: string;
  descricao?: string;
}

// Função para calcular o tempo total do inventário
const calculateTotalTime = (items: InventarioItem[], isConcluido: boolean): string => {
  if (items.length === 0 && isConcluido) {
    return "1 min";
  }
  
  if (items.length === 0) {
    return "0 min";
  }
  
  if (items.length === 1) {
    return "1 min";
  }
  
  // Ordenar itens por created_at do mais antigo para o mais recente
  const sortedItems = [...items].sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  let totalSeconds = 0;
  
  // Calcular intervalos entre itens consecutivos
  for (let i = 1; i < sortedItems.length; i++) {
    const prevTime = sortedItems[i - 1].created_at;
    const currTime = sortedItems[i].created_at;
    
    if (prevTime && currTime) {
      const diff = new Date(currTime).getTime() - new Date(prevTime).getTime();
      totalSeconds += diff / 1000;
    }
  }
  
  // Converter para formato legível
  if (totalSeconds < 60) {
    return "1 min";
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  
  return `${minutes} min`;
};

export default function InventariarAmbiente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
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
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  // Novos estados para tipo de inventariante
  const [tipoInventariante, setTipoInventariante] = useState<'individual' | 'dupla'>('individual');
  const [grupoUsuario, setGrupoUsuario] = useState<string | null>(null);
  
  // Estado para checkbox "Sem Patrimônio" e quantidade
  const [semPatrimonio, setSemPatrimonio] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  
  const patrimonioRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ambiente && id) {
      fetchAmbiente();
    }
    fetchDescricoes();
    checkAdminStatus();
    fetchGrupoUsuario();
    if (id) {
      fetchOrCreateInventario();
    }
  }, [id, ambiente]);

  // Buscar o grupo do usuário
  const fetchGrupoUsuario = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('grupos_usuarios')
        .select(`
          grupo_id,
          grupos!inner(nome)
        `)
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.grupos) {
        setGrupoUsuario((data.grupos as any).nome);
      } else {
        setGrupoUsuario(null);
      }
    } catch (error) {
      console.error('Error fetching grupo usuario:', error);
      setGrupoUsuario(null);
    }
  };

  // Handler para mudança de tipo de inventariante
  const handleTipoInventarianteChange = (value: 'individual' | 'dupla') => {
    if (value === 'dupla' && !grupoUsuario) {
      toast({
        title: "Atenção",
        description: "O usuário não faz parte de nenhuma dupla. Entre em contato com o Presidente do Inventário.",
        variant: "destructive",
      });
      setTipoInventariante('individual');
      return;
    }
    setTipoInventariante(value);
  };

  // Função para obter o nome do inventariante
  const getInventariante = (): string => {
    if (tipoInventariante === 'individual') {
      return user?.nome || 'Usuário desconhecido';
    } else {
      return grupoUsuario || 'Grupo desconhecido';
    }
  };

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

      // Buscar itens do inventário ordenados do mais recente para o mais antigo
      const { data: itensData, error: itensError } = await supabase
        .from('inventario_itens')
        .select('*')
        .eq('inventario_id', inventario.id)
        .order('created_at', { ascending: false });

      if (itensError) throw itensError;

      if (itensData && itensData.length > 0) {
        const mappedItems = itensData.map(item => ({
          id: item.id.toString(),
          patrimonio: item.patrimonio,
          descricao: item.descricao,
          situacao: item.situacao as 'Bom' | 'Inservível',
          created_at: item.created_at,
          inventariante: (item as any).inventariante || undefined,
          duplicado: (item as any).duplicado || 'Não',
          tipo_cadastro: ((item as any).tipo_cadastro || 'M') as 'A' | 'M'
        }));
        setItems(mappedItems);
      } else {
        // Se não há itens, garantir que o status seja "nao_iniciado"
        if (inventario.status !== 'nao_iniciado') {
          const { error: statusError } = await supabase
            .from('inventarios')
            .update({ status: 'nao_iniciado' })
            .eq('id', inventario.id);

          if (statusError) {
            console.error('Error updating status:', statusError);
          }
        }
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
      // Buscar todas as descrições distintas usando uma abordagem paginada
      let allDescricoes: string[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('bens')
          .select('descricao')
          .not('descricao', 'is', null)
          .order('descricao')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          const descriptions = data
            .map(b => b.descricao?.trim())
            .filter((d): d is string => Boolean(d && d.length > 0));
          allDescricoes = [...allDescricoes, ...descriptions];
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      // Extrair descrições únicas
      const uniqueDescricoes = [...new Set(allDescricoes)];
      console.log('Descrições carregadas:', uniqueDescricoes.length);
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

  const verificarItemDuplicado = async (patrimonio: string): Promise<boolean> => {
    try {
      // Buscar se o patrimônio já existe em algum outro inventário (não no atual)
      const { data: itemExistente, error } = await supabase
        .from('inventario_itens')
        .select('id, inventario_id')
        .eq('patrimonio', patrimonio)
        .neq('inventario_id', inventarioId || 0)
        .limit(1);

      if (error) {
        console.error('Error checking duplicate:', error);
        return false;
      }

      return itemExistente && itemExistente.length > 0;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const handlePatrimonioKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && currentItem.patrimonio.trim()) {
      e.preventDefault();
      
      // Verificar se o item já está cadastrado em outro ambiente
      const isDuplicado = await verificarItemDuplicado(currentItem.patrimonio.trim());
      
      const bem = await buscarBemPorPatrimonio(currentItem.patrimonio.trim());
      
      if (bem && bem.descricao) {
        // Bem encontrado - salvar no banco automaticamente
        if (!inventarioId) {
          toast({
            title: "Erro",
            description: "Inventário não foi inicializado corretamente",
            variant: "destructive",
          });
          return;
        }

        try {
          // Salvar no banco de dados - Automático (A) porque bem existe na tabela bens
          const { data: itemData, error: itemError } = await supabase
            .from('inventario_itens')
            .insert({
              inventario_id: inventarioId,
              patrimonio: currentItem.patrimonio,
              descricao: bem.descricao,
              situacao: currentItem.situacao,
              inventariante: getInventariante(),
              duplicado: isDuplicado ? 'Sim' : 'Não',
              tipo_cadastro: 'A'
            } as any)
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
            descricao: bem.descricao,
            situacao: currentItem.situacao,
            created_at: itemData.created_at,
            inventariante: (itemData as any).inventariante,
            duplicado: (itemData as any).duplicado,
            tipo_cadastro: 'A'
          };

          setItems([newItem, ...items]);
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
        } catch (error) {
          console.error('Error adding item:', error);
          toast({
            title: "Erro",
            description: "Erro ao adicionar item",
            variant: "destructive",
          });
        }
      } else {
        // Bem não encontrado - mover para campo descrição
        descricaoRef.current?.focus();
      }
    }
  };

  const handleCadastrar = async () => {
    console.log('=== handleCadastrar iniciado ===');
    console.log('currentItem:', currentItem);
    console.log('inventarioId:', inventarioId);
    console.log('isConcluido:', isConcluido);

    // Validação diferente se for "Sem Patrimônio"
    if (semPatrimonio) {
      if (!currentItem.descricao.trim()) {
        toast({
          title: "Atenção",
          description: "Preencha a descrição do item",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!currentItem.patrimonio.trim() || !currentItem.descricao.trim()) {
        toast({
          title: "Atenção",
          description: "Preencha o patrimônio e a descrição",
          variant: "destructive",
        });
        return;
      }

      // Verificar se o patrimônio já existe neste ambiente (exceto "Sem patrimônio")
      const patrimonioExisteNoAmbiente = items.some(
        item => item.patrimonio === currentItem.patrimonio.trim() && item.patrimonio !== 'Sem patrimônio'
      );
      
      if (patrimonioExisteNoAmbiente) {
        toast({
          title: "Atenção",
          description: "Esse patrimônio já foi cadastrado neste ambiente",
          variant: "destructive",
        });
        return;
      }
    }

    // Itens "Sem patrimônio" não são considerados duplicados em outros ambientes
    const isDuplicado = semPatrimonio ? false : await verificarItemDuplicado(currentItem.patrimonio.trim());

    if (isConcluido) {
      toast({
        title: "Atenção",
        description: "Este inventário já foi concluído",
        variant: "destructive",
      });
      return;
    }

    if (!inventarioId) {
      toast({
        title: "Erro",
        description: "Inventário não foi inicializado corretamente",
        variant: "destructive",
      });
      console.error('inventarioId is null');
      return;
    }

    try {
      console.log('Tentando inserir item no banco...');
      // Salvar no banco de dados - Manual (M) porque descrição foi digitada manualmente
      const patrimonioValue = semPatrimonio ? 'Sem patrimônio' : currentItem.patrimonio;
      const qtdToInsert = semPatrimonio ? quantidade : 1;
      
      const newItems: InventarioItem[] = [];
      
      for (let i = 0; i < qtdToInsert; i++) {
        const { data: itemData, error: itemError } = await supabase
          .from('inventario_itens')
          .insert({
            inventario_id: inventarioId,
            patrimonio: patrimonioValue,
            descricao: currentItem.descricao,
            situacao: currentItem.situacao,
            inventariante: getInventariante(),
            duplicado: isDuplicado ? 'Sim' : 'Não',
            tipo_cadastro: 'M'
          } as any)
          .select()
          .single();

        console.log('Resultado da inserção:', { itemData, itemError });

        if (itemError) throw itemError;

        // Atualizar status para "em_andamento" se for o primeiro item
        if (items.length === 0 && i === 0) {
          const { error: statusError } = await supabase
            .from('inventarios')
            .update({ status: 'em_andamento' })
            .eq('id', inventarioId);

          if (statusError) throw statusError;
        }

        const newItem: InventarioItem = {
          id: itemData.id.toString(),
          patrimonio: patrimonioValue,
          descricao: currentItem.descricao,
          situacao: currentItem.situacao,
          created_at: itemData.created_at,
          inventariante: (itemData as any).inventariante,
          duplicado: (itemData as any).duplicado,
          tipo_cadastro: 'M'
        };

        newItems.push(newItem);
      }

      setItems([...newItems.reverse(), ...items]);
      setCurrentItem({
        patrimonio: '',
        descricao: '',
        situacao: 'Bom'
      });
      setSemPatrimonio(false);
      setQuantidade(1);

      toast({
        title: "Sucesso",
        description: qtdToInsert > 1 ? `${qtdToInsert} itens adicionados ao inventário` : "Item adicionado ao inventário",
      });

      console.log('Itens cadastrados com sucesso:', newItems);
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive",
      });
    }
  };

  const handleSalvar = async () => {
    if (items.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione itens ao inventário antes de salvar",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: `Inventário do ${ambiente?.nome} salvo com sucesso! ${items.length} ${items.length === 1 ? 'item registrado' : 'itens registrados'}.`,
    });
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

      // Se não houver mais itens, voltar status para "nao_iniciado"
      if (newItems.length === 0 && inventarioId) {
        const { error: statusError } = await supabase
          .from('inventarios')
          .update({ status: 'nao_iniciado' })
          .eq('id', inventarioId);

        if (statusError) {
          console.error('Error updating status:', statusError);
        }
      }

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
      // Atualizar status para concluído (sem vincular usuário por enquanto)
      const { error } = await supabase
        .from('inventarios')
        .update({ 
          status: 'concluido',
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

  const processarPatrimonioScanner = async (patrimonio: string) => {
    // Preencher o campo patrimônio com o valor lido
    setCurrentItem(prev => ({...prev, patrimonio}));
    
    // Verificar se o item já está cadastrado em outro ambiente
    const isDuplicado = await verificarItemDuplicado(patrimonio);
    
    const bem = await buscarBemPorPatrimonio(patrimonio);
    
    if (bem && bem.descricao) {
      // Bem encontrado - salvar no banco automaticamente
      if (!inventarioId) {
        toast({
          title: "Erro",
          description: "Inventário não foi inicializado corretamente",
          variant: "destructive",
        });
        return;
      }

      try {
        // Salvar no banco de dados - Automático (A) porque bem existe na tabela bens
        const { data: itemData, error: itemError } = await supabase
          .from('inventario_itens')
          .insert({
            inventario_id: inventarioId,
            patrimonio: patrimonio,
            descricao: bem.descricao,
            situacao: currentItem.situacao,
            inventariante: getInventariante(),
            duplicado: isDuplicado ? 'Sim' : 'Não',
            tipo_cadastro: 'A'
          } as any)
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
          patrimonio: patrimonio,
          descricao: bem.descricao,
          situacao: currentItem.situacao,
          created_at: itemData.created_at,
          inventariante: (itemData as any).inventariante,
          duplicado: (itemData as any).duplicado,
          tipo_cadastro: 'A'
        };

        setItems([newItem, ...items]);
        
        // Limpar o campo patrimônio para próxima leitura
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
    } else {
      // Bem não encontrado - preencher apenas o campo patrimônio para cadastro manual
      toast({
        title: "Bem não encontrado",
        description: `Patrimônio ${patrimonio} inserido. Preencha a descrição manualmente.`,
      });
      
      // Focar no campo de descrição
      setTimeout(() => descricaoRef.current?.focus(), 100);
    }
  };

  const handleBarcodeScan = (code: string) => {
    console.log("Código lido:", code);
    processarPatrimonioScanner(code);
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

        {/* Seção Quem está inventariando? */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Quem está inventariando?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={tipoInventariante}
              onValueChange={(value) => handleTipoInventarianteChange(value as 'individual' | 'dupla')}
              className="flex flex-row gap-6"
              disabled={isConcluido}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" disabled={isConcluido} />
                <Label htmlFor="individual" className="cursor-pointer">
                  Individual ({user?.nome || 'Usuário'})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dupla" id="dupla" disabled={isConcluido} />
                <Label htmlFor="dupla" className="cursor-pointer">
                  Dupla {grupoUsuario ? `(${grupoUsuario})` : ''}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Item ao Inventário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center space-x-2 h-10">
                  <Checkbox
                    id="sem-patrimonio"
                    checked={semPatrimonio}
                    onCheckedChange={(checked) => {
                      setSemPatrimonio(checked === true);
                      if (checked) {
                        setCurrentItem({...currentItem, patrimonio: ''});
                        setQuantidade(1);
                      }
                    }}
                    disabled={isConcluido}
                  />
                  <Label htmlFor="sem-patrimonio" className="cursor-pointer text-sm whitespace-nowrap">
                    Sem Patrimônio
                  </Label>
                </div>
              </div>
              {semPatrimonio && (
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={isConcluido}
                    className="w-24"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="patrimonio">Patrimônio</Label>
                <Input
                  ref={patrimonioRef}
                  id="patrimonio"
                  type="text"
                  inputMode="numeric"
                  enterKeyHint="next"
                  value={currentItem.patrimonio}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCurrentItem({...currentItem, patrimonio: value});
                  }}
                  onKeyDown={handlePatrimonioKeyDown}
                  placeholder="Número do patrimônio"
                  disabled={isConcluido || semPatrimonio}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <div className="relative">
                  <Input
                    ref={descricaoRef}
                    id="descricao"
                    type="text"
                    inputMode="text"
                    enterKeyHint="done"
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setOpenDescricao(false);
                        handleCadastrar();
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
                  {openDescricao && currentItem.descricao.trim().length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-auto">
                      {(() => {
                        const searchTerm = currentItem.descricao.toLowerCase().trim();
                        const filtered = descricoes.filter(desc => 
                          desc && desc.toLowerCase().includes(searchTerm)
                        ).slice(0, 10);
                        
                        if (filtered.length === 0) {
                          return (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Nenhuma sugestão encontrada
                            </div>
                          );
                        }
                        
                        return filtered.map((descricao, index) => (
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
                        ));
                      })()}
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
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(true)}
                  disabled={isConcluido}
                  title="Ler código de barras"
                >
                  <Camera className="h-4 w-4" />
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
            <CardTitle className="flex items-center justify-between">
              <span>Itens do Inventário ({items.length})</span>
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Tempo: {calculateTotalTime(items, isConcluido)}</span>
              </div>
            </CardTitle>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duplicado</TableHead>
                    <TableHead>Inventariante</TableHead>
                    <TableHead>Data/Hora</TableHead>
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
                      <TableCell className="font-medium">{item.patrimonio || '-'}</TableCell>
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
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.tipo_cadastro === 'A' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`} title={item.tipo_cadastro === 'A' ? 'Automático - Bem existe no banco de dados' : 'Manual - Cadastrado manualmente'}>
                          {item.tipo_cadastro || 'M'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.duplicado === 'Sim' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.duplicado || 'Não'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.inventariante || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.created_at 
                          ? new Date(item.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
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
          <Button onClick={handleSalvar} disabled={isConcluido || items.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
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

        <BarcodeScanner
          isOpen={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onScan={handleBarcodeScan}
        />
      </div>
    </div>
  );
}