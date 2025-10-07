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
import { Building2, Plus, Trash2, ArrowLeft, Save, CheckCircle, Unlock, Camera, X } from "lucide-react";
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
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
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

  const verificarItemDuplicado = async (patrimonio: string) => {
    try {
      // Buscar se o patrimônio já existe em algum inventário
      const { data: itemExistente, error } = await supabase
        .from('inventario_itens')
        .select(`
          *,
          inventarios!inner(
            ambiente_id,
            ambientes!inner(nome)
          )
        `)
        .eq('patrimonio', patrimonio)
        .maybeSingle();

      if (error) {
        console.error('Error checking duplicate:', error);
        return null;
      }

      return itemExistente;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return null;
    }
  };

  const handlePatrimonioKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && currentItem.patrimonio.trim()) {
      e.preventDefault();
      
      // Verificar se o item já está cadastrado em algum ambiente
      const itemDuplicado = await verificarItemDuplicado(currentItem.patrimonio.trim());
      
      if (itemDuplicado) {
        const nomeAmbiente = itemDuplicado.inventarios?.ambientes?.nome || 'outro ambiente';
        toast({
          title: "Item duplicado",
          description: `Este patrimônio já foi cadastrado no ambiente: ${nomeAmbiente}`,
          variant: "destructive",
        });
        return;
      }
      
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
          // Salvar no banco de dados
          const { data: itemData, error: itemError } = await supabase
            .from('inventario_itens')
            .insert({
              inventario_id: inventarioId,
              patrimonio: currentItem.patrimonio,
              descricao: bem.descricao,
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

    if (!currentItem.patrimonio.trim() || !currentItem.descricao.trim()) {
      toast({
        title: "Atenção",
        description: "Preencha o patrimônio e a descrição",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o item já está cadastrado em algum ambiente
    const itemDuplicado = await verificarItemDuplicado(currentItem.patrimonio.trim());
    
    if (itemDuplicado) {
      const nomeAmbiente = itemDuplicado.inventarios?.ambientes?.nome || 'outro ambiente';
      toast({
        title: "Item duplicado",
        description: `Este patrimônio já foi cadastrado no ambiente: ${nomeAmbiente}`,
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
    // Verificar se o item já está cadastrado em algum ambiente
    const itemDuplicado = await verificarItemDuplicado(patrimonio);
    
    if (itemDuplicado) {
      const nomeAmbiente = itemDuplicado.inventarios?.ambientes?.nome || 'outro ambiente';
      toast({
        title: "Item duplicado",
        description: `Este patrimônio já foi cadastrado no ambiente: ${nomeAmbiente}`,
        variant: "destructive",
      });
      stopBarcodeScanner();
      return;
    }
    
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
        // Salvar no banco de dados
        const { data: itemData, error: itemError } = await supabase
          .from('inventario_itens')
          .insert({
            inventario_id: inventarioId,
            patrimonio: patrimonio,
            descricao: bem.descricao,
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
          patrimonio: patrimonio,
          descricao: bem.descricao,
          situacao: currentItem.situacao
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

      // Tentar obter a lista de dispositivos de vídeo disponíveis
      let selectedDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Procurar pela câmera traseira (environment)
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('traseira')
        );
        
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId;
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
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        } : null,
        // Tentar com facingMode environment (ideal, não exact)
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        // Tentar com apenas video básico
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
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
            console.log('Câmera obtida com sucesso:', constraints);
            break;
          }
        } catch (err) {
          console.log('Tentativa falhou com constraints:', constraints, err);
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
        const timeout = setTimeout(() => reject(new Error('Timeout ao iniciar vídeo')), 5000);
        videoRef.current!.onloadedmetadata = () => {
          clearTimeout(timeout);
          videoRef.current!.play()
            .then(() => resolve())
            .catch(reject);
        };
      });

      // Importar e iniciar o scanner com hints otimizados
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { BarcodeFormat, DecodeHintType } = await import('@zxing/library');
      
      const hints = new Map();
      
      // Formatos de código de barras mais comuns
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODABAR,
        BarcodeFormat.ITF
      ]);
      
      // Tentar mais agressivamente decodificar
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      // Assumir que o código está em uma única linha
      hints.set(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT, false);

      const codeReader = new BrowserMultiFormatReader(hints);
      scannerRef.current = codeReader;

      // Iniciar decodificação contínua
      codeReader.decodeFromVideoElement(
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcodeText = result.getText();
            console.log('Código lido:', barcodeText);
            
            // Emitir som de confirmação
            playBeep();
            
            toast({
              title: "Código lido",
              description: `Processando patrimônio: ${barcodeText}`,
            });
            
            // Processar automaticamente o patrimônio
            processarPatrimonioScanner(barcodeText);
          }
          
          // Não logar erros NotFoundException (são esperados durante a varredura)
          if (error && error.name !== 'NotFoundException') {
            console.error('Erro ao decodificar:', error);
          }
        }
      );
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
                  type="text"
                  inputMode="text"
                  enterKeyHint="next"
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