import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface ExampleItemCardProps {
  patrimonio: string;
  descricao: string;
  situacao: "Bom" | "Regular" | "Ruim" | "Inservível";
  tipoCadastro: "A" | "M";
  inventariante: string;
  duplicado?: boolean;
}

export function ExampleItemCard({
  patrimonio,
  descricao,
  situacao,
  tipoCadastro,
  inventariante,
  duplicado = false,
}: ExampleItemCardProps) {
  const getSituacaoColor = (sit: string) => {
    switch (sit) {
      case "Bom":
        return "bg-success text-success-foreground";
      case "Regular":
        return "bg-primary text-primary-foreground";
      case "Ruim":
        return "bg-warning text-warning-foreground";
      case "Inservível":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-primary">{patrimonio}</span>
            <Badge variant="outline" className="text-xs">
              Tipo {tipoCadastro}
            </Badge>
            {duplicado && (
              <Badge variant="destructive" className="text-xs">
                DUPLICADO
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">{descricao}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getSituacaoColor(situacao)}>{situacao}</Badge>
            <span className="text-xs text-muted-foreground">por {inventariante}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
