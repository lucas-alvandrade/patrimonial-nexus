import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ScanBarcode, Save } from "lucide-react";

interface ExampleInputFormProps {
  patrimonio?: string;
  descricao?: string;
  situacao?: string;
  showFilled?: boolean;
}

export function ExampleInputForm({
  patrimonio = "",
  descricao = "",
  situacao = "",
  showFilled = false,
}: ExampleInputFormProps) {
  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ex-patrimonio">Patrimônio</Label>
          <div className="flex gap-2">
            <Input
              id="ex-patrimonio"
              placeholder="Digite o número"
              value={showFilled ? patrimonio : ""}
              readOnly
              className={showFilled ? "font-mono bg-muted" : ""}
            />
            <Button variant="outline" size="icon" disabled>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ScanBarcode className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ex-situacao">Situação</Label>
          <Select value={showFilled ? situacao : ""} disabled>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bom">Bom</SelectItem>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Ruim">Ruim</SelectItem>
              <SelectItem value="Inservível">Inservível</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ex-descricao">Descrição</Label>
        <Input
          id="ex-descricao"
          placeholder="Descrição do bem"
          value={showFilled ? descricao : ""}
          readOnly
          className={showFilled ? "bg-muted" : ""}
        />
      </div>
      
      <Button className="w-full" disabled>
        <Save className="h-4 w-4 mr-2" />
        Salvar Item
      </Button>
    </div>
  );
}
