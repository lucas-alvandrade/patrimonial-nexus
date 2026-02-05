import { Button } from "@/components/ui/button";
import { X, ScanBarcode, Zap } from "lucide-react";

export function ExampleScannerModal() {
  return (
    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Leitor de Código de Barras</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="relative bg-foreground/90 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
        {/* Simulated camera view */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/60 to-foreground/80" />
        
        {/* Scanning frame */}
        <div className="relative z-10 w-3/4 h-1/2 border-2 border-primary rounded-lg">
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br" />
          
          {/* Scanning line animation simulation */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/50" />
        </div>
        
        {/* Camera icon */}
        <ScanBarcode className="absolute bottom-3 right-3 h-6 w-6 text-white/50" />
      </div>
      
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-3 w-3" />
        <span>Posicione o código de barras dentro do quadro</span>
      </div>
    </div>
  );
}
