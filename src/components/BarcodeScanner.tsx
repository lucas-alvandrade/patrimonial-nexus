import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const playBeep = () => {
    try {
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
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        console.log("Scanner parado");
      } catch (error) {
        console.log("Erro ao parar scanner:", error);
      }
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    const scannerId = "barcode-scanner-reader";
    
    // Verificar se o elemento existe
    const scannerElement = document.getElementById(scannerId);
    if (!scannerElement) {
      console.log("Elemento do scanner não encontrado, aguardando...");
      return;
    }

    try {
      // Criar nova instância do scanner
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // Formatos suportados conforme solicitado
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODE_128,
      ];

      // Configurações do scanner
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 150 },
        formatsToSupport: formatsToSupport,
        aspectRatio: 1.5,
      };

      // Callback de sucesso
      const onScanSuccess = (decodedText: string) => {
        console.log("✅ Código lido:", decodedText);
        
        // Emitir beep de confirmação
        playBeep();
        
        // Parar o scanner
        stopScanner();
        
        // Chamar callback com o código lido
        onScan(decodedText);
        
        // Fechar o modal
        onClose();
      };

      // Callback de erro (ignorar, são erros normais durante varredura)
      const onScanError = (errorMessage: string) => {
        // Não logar erros de "No barcode or QR code detected" - são esperados
      };

      // Iniciar scanner com câmera traseira
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
      setHasPermissionError(false);
      console.log("Scanner iniciado com sucesso");

    } catch (error: any) {
      console.error("Erro ao iniciar scanner:", error);
      
      let errorMessage = "Não foi possível acessar a câmera.";
      
      if (error.name === "NotAllowedError" || error.message?.includes("Permission")) {
        errorMessage = "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.";
        setHasPermissionError(true);
      } else if (error.name === "NotFoundError" || error.message?.includes("not found")) {
        errorMessage = "Nenhuma câmera foi encontrada no dispositivo.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "A câmera está sendo usada por outro aplicativo.";
      }
      
      toast({
        title: "Erro ao acessar câmera",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Aguardar o modal renderizar antes de iniciar o scanner
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>Leitor de Código de Barras</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full px-4 pb-4">
          {/* Container do scanner */}
          <div 
            id="barcode-scanner-reader" 
            className="w-full rounded-lg overflow-hidden bg-black"
            style={{ minHeight: '300px' }}
          />
          
          {/* Overlay com linha de escaneamento */}
          {isScanning && (
            <div className="absolute inset-4 pointer-events-none flex items-center justify-center">
              <div className="relative w-[280px] h-[150px] border-2 border-primary rounded-lg">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary animate-pulse" />
              </div>
            </div>
          )}
          
          {hasPermissionError && (
            <div className="absolute inset-4 flex items-center justify-center bg-background/90 rounded-lg">
              <div className="text-center p-4">
                <p className="text-destructive font-medium mb-2">Permissão Negada</p>
                <p className="text-sm text-muted-foreground">
                  Por favor, permita o acesso à câmera nas configurações do navegador.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 pt-0 text-center">
          <p className="text-sm text-muted-foreground">
            Posicione o código de barras dentro da área marcada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formatos suportados: EAN-13, EAN-8, UPC-A, UPC-E, ITF, Code 128
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
