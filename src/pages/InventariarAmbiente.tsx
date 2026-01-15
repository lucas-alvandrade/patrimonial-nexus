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
import { Building2, Plus, Trash2, ArrowLeft, Save, CheckCircle, Unlock, Camera, X, Clock, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
  
  // Estado para checkbox "Sem Patrimônio"
  const [semPatrimonio, setSemPatrimonio] = useState(false);
  
  const patrimonioRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      if (items.length === 0) {
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

      setItems([newItem, ...items]);
      setCurrentItem({
        patrimonio: '',
        descricao: '',
        situacao: 'Bom'
      });
      setSemPatrimonio(false);

      toast({
        title: "Sucesso",
        description: "Item adicionado ao inventário",
      });

      console.log('Item cadastrado com sucesso:', newItem);
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

  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const processarPatrimonioScanner = async (patrimonio: string) => {
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
        stopBarcodeScanner();
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
          inventariante: (itemData as any).inventariante,
          duplicado: (itemData as any).duplicado,
          tipo_cadastro: 'A'
        };

        setItems([...items, newItem]);

        toast({
          title: "Sucesso",
          description: "Item adicionado ao inventário",
        });
        
        // Fechar a câmera após adicionar o item
        stopBarcodeScanner();
      } catch (error) {
        console.error('Error adding item:', error);
        toast({
          title: "Erro",
          description: "Erro ao adicionar item",
          variant: "destructive",
        });
        stopBarcodeScanner();
      }
    } else {
      // Bem não encontrado
      toast({
        title: "Bem não encontrado",
        description: `Patrimônio ${patrimonio} não existe na tabela de Bens`,
        variant: "destructive",
      });
      stopBarcodeScanner();
    }
  };

  const startBarcodeScanner = async () => {
    try {
      setShowBarcodeScanner(true);
      
      // Aguardar um pouco para o vídeo estar disponível
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        toast({
          title: "Erro",
          description: "Elemento de vídeo não disponível",
          variant: "destructive",
        });
        setShowBarcodeScanner(false);
        return;
      }

      console.log('Iniciando scanner de código de barras...');

      // Tentar obter a lista de dispositivos de vídeo disponíveis
      let selectedDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Câmeras disponíveis:', videoDevices.length);
        
        // Procurar pela câmera traseira (environment)
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('traseira') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId;
          console.log('Câmera traseira encontrada:', backCamera.label);
        }
      } catch (err) {
        console.log('Não foi possível enumerar dispositivos:', err);
      }

      // Tentar diferentes configurações de câmera com fallbacks
      const constraintsList = [
        // Tentar com deviceId específico se encontrado
        selectedDeviceId ? {
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 }
          }
        } : null,
        // Tentar com facingMode environment (exact)
        {
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 }
          }
        },
        // Tentar com facingMode environment (ideal)
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 }
          }
        },
        // Tentar com alta resolução
        {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        },
        // Fallback final - qualquer câmera
        { video: true }
      ].filter(Boolean);

      let stream: MediaStream | null = null;
      let lastError: any = null;

      // Tentar cada constraint até conseguir uma câmera
      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
          if (stream) {
            console.log('Câmera obtida com sucesso');
            break;
          }
        } catch (err) {
          console.log('Tentativa falhou, tentando próxima configuração...');
          lastError = err;
        }
      }

      if (!stream) {
        throw lastError || new Error('Não foi possível acessar a câmera');
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Configurar atributos do vídeo para melhor compatibilidade mobile
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.muted = true;

      // Aguardar o vídeo estar pronto
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout ao iniciar vídeo')), 10000);
        videoRef.current!.onloadedmetadata = () => {
          clearTimeout(timeout);
          videoRef.current!.play()
            .then(() => {
              console.log('Vídeo iniciado com sucesso');
              resolve();
            })
            .catch(reject);
        };
      });

      // Importar e iniciar o scanner com hints otimizados
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { BarcodeFormat, DecodeHintType } = await import('@zxing/library');
      
      const hints = new Map();
      
      // Formatos de código de barras mais comuns
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODABAR,
        BarcodeFormat.ITF
      ]);
      
      // Tentar mais agressivamente decodificar
      hints.set(DecodeHintType.TRY_HARDER, true);

      const codeReader = new BrowserMultiFormatReader(hints);
      scannerRef.current = codeReader;

      console.log('Iniciando decodificação contínua...');
      
      let isProcessing = false;

      // Usar decodeFromStream para melhor compatibilidade
      await codeReader.decodeFromStream(
        stream,
        videoRef.current,
        (result, error) => {
          if (result && !isProcessing) {
            isProcessing = true;
            const barcodeText = result.getText();
            console.log('✅ Código detectado:', barcodeText);
            
            // Emitir som de confirmação
            playBeep();
            
            // Mostrar toast de sucesso
            toast({
              title: "✅ Código lido com sucesso!",
              description: `Patrimônio: ${barcodeText}`,
            });
            
            // Processar automaticamente o patrimônio
            processarPatrimonioScanner(barcodeText);
            
            // Pequeno delay antes de permitir nova leitura
            setTimeout(() => {
              isProcessing = false;
            }, 1000);
          }
          
          // Não logar erros NotFoundException (são esperados durante a varredura)
          if (error && error.name !== 'NotFoundException') {
            console.log('Erro na detecção:', error.name);
          }
        }
      );
      
      console.log('Scanner configurado e ativo');
      
      toast({
        title: "📷 Câmera ativa",
        description: "Aproxime o código de barras da câmera",
      });
      
    } catch (error: any) {
      console.error('Error starting barcode scanner:', error);
      
      let errorMessage = "Não foi possível acessar a câmera.";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "Nenhuma câmera foi encontrada no dispositivo.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = "A câmera está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera.";
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = "A câmera não suporta as configurações necessárias.";
      }
      
      toast({
        title: "Erro ao acessar câmera",
        description: errorMessage,
        variant: "destructive",
      });
      setShowBarcodeScanner(false);
    }
  };

  const stopBarcodeScanner = () => {
    console.log('Fechando scanner...');
    
    // Parar o scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.reset();
      } catch (e) {
        console.error('Erro ao resetar scanner:', e);
      }
      scannerRef.current = null;
    }
    
    // Parar o stream da câmera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track parado:', track.kind);
      });
      streamRef.current = null;
    }
    
    // Limpar o vídeo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowBarcodeScanner(false);
    console.log('Scanner fechado');
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
                      }
                    }}
                    disabled={isConcluido}
                  />
                  <Label htmlFor="sem-patrimonio" className="cursor-pointer text-sm whitespace-nowrap">
                    Sem Patrimônio
                  </Label>
                </div>
              </div>
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
                  onClick={startBarcodeScanner}
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

        {showBarcodeScanner && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-black/50">
              <h2 className="text-white text-xl font-semibold">Scanner de Código de Barras</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={stopBarcodeScanner}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1 bg-primary/70 animate-pulse" />
              </div>
            </div>
            <div className="p-4 text-center text-white">
              <p className="text-sm">Posicione o código de barras dentro da área marcada</p>
              <p className="text-xs text-gray-400 mt-2">A câmera fechará automaticamente após adicionar o item</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}