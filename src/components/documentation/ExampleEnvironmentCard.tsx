import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package } from "lucide-react";

interface ExampleEnvironmentCardProps {
  nome: string;
  bloco: string;
  status: "nao_iniciado" | "em_andamento" | "concluido";
  totalItens?: number;
}

export function ExampleEnvironmentCard({
  nome,
  bloco,
  status,
  totalItens = 0,
}: ExampleEnvironmentCardProps) {
  const getStatusConfig = (st: string) => {
    switch (st) {
      case "nao_iniciado":
        return { label: "Não Iniciado", className: "bg-secondary text-secondary-foreground" };
      case "em_andamento":
        return { label: "Em Andamento", className: "bg-warning text-warning-foreground" };
      case "concluido":
        return { label: "Concluído", className: "bg-success text-success-foreground" };
      default:
        return { label: "Desconhecido", className: "bg-muted text-muted-foreground" };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <h4 className="font-semibold truncate">{nome}</h4>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Bloco: {bloco}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            {totalItens > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                {totalItens} itens
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          Inventariar
        </Button>
      </div>
    </div>
  );
}
