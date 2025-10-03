import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Package,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function Relatorios() {
  const { isAdmin } = useAuth();

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Você não tem permissão para acessar esta página. Esta área é restrita a administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gerarRelatorioItensLocalizados = async () => {
    try {
      const { data: inventarioItens, error } = await supabase
        .from("inventario_itens")
        .select(`
          patrimonio,
          descricao,
          inventario_id
        `);

      if (error) throw error;

      // Buscar dados dos bens para cada item
      const itensComDetalhes = await Promise.all(
        inventarioItens.map(async (item) => {
          const { data: bem } = await supabase
            .from("bens")
            .select("carga_atual, setor_responsavel, valor")
            .eq("numero_patrimonio", item.patrimonio)
            .single();

          // Buscar ambiente através do inventário
          const { data: inventario } = await supabase
            .from("inventarios")
            .select("ambiente_id")
            .eq("id", item.inventario_id)
            .single();

          let nomeAmbiente = "";
          if (inventario) {
            const { data: ambiente } = await supabase
              .from("ambientes")
              .select("nome")
              .eq("id", inventario.ambiente_id)
              .single();
            nomeAmbiente = ambiente?.nome || "";
          }

          return {
            Ambiente: nomeAmbiente,
            Patrimônio: item.patrimonio,
            Descrição: item.descricao,
            "Carga Atual": bem?.carga_atual || "",
            "Setor Responsável": bem?.setor_responsavel || "",
            Valor: bem?.valor || 0,
          };
        })
      );

      // Criar planilha Excel
      const ws = XLSX.utils.json_to_sheet(itensComDetalhes);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Itens Localizados");
      XLSX.writeFile(wb, "relatorio_itens_localizados.xlsx");

      toast.success("Relatório de itens localizados gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório de itens localizados");
    }
  };

  const gerarRelatorioItensNaoLocalizados = async () => {
    try {
      // Buscar todos os bens
      const { data: bens, error: bensError } = await supabase
        .from("bens")
        .select("numero_patrimonio, descricao, carga_atual, setor_responsavel, valor");

      if (bensError) throw bensError;

      // Buscar todos os patrimônios localizados
      const { data: itensLocalizados, error: itensError } = await supabase
        .from("inventario_itens")
        .select("patrimonio");

      if (itensError) throw itensError;

      const patrimoniosLocalizados = new Set(
        itensLocalizados.map((item) => item.patrimonio)
      );

      // Filtrar bens não localizados
      const itensNaoLocalizados = bens
        .filter((bem) => !patrimoniosLocalizados.has(bem.numero_patrimonio))
        .map((bem) => ({
          Patrimônio: bem.numero_patrimonio,
          Descrição: bem.descricao,
          "Carga Atual": bem.carga_atual || "",
          "Setor Responsável": bem.setor_responsavel || "",
          Valor: bem.valor || 0,
        }));

      // Criar planilha Excel
      const ws = XLSX.utils.json_to_sheet(itensNaoLocalizados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Itens Não Localizados");
      XLSX.writeFile(wb, "relatorio_itens_nao_localizados.xlsx");

      toast.success("Relatório de itens não localizados gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório de itens não localizados");
    }
  };

  const relatorios = [
    {
      id: 1,
      titulo: "Itens Localizados",
      descricao: "Lista completa de todos os itens localizados durante o inventário",
      icon: Package,
      frequencia: "Sob demanda",
      acao: gerarRelatorioItensLocalizados,
    },
    {
      id: 2,
      titulo: "Itens Não Localizados",
      descricao: "Lista de itens cadastrados que não foram encontrados no inventário",
      icon: AlertTriangle,
      frequencia: "Sob demanda",
      acao: gerarRelatorioItensNaoLocalizados,
    },
  ];

  const dashboardData = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios e Análises</h1>
          <p className="text-muted-foreground">
            Gere relatórios detalhados e acompanhe métricas do patrimônio
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="mes">
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="trimestre">Este Trimestre</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData.map((item, index) => (
          <Card key={index} className="transition-smooth hover:shadow-elegant-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.titulo}</p>
                  <p className="text-2xl font-bold text-foreground">{item.valor}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs font-medium ${
                      item.tipo === 'positivo' ? 'text-success' : 
                      item.tipo === 'negativo' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {item.variacao}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {item.periodo}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relatórios Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Relatórios Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatorios.map((relatorio) => (
              <Card key={relatorio.id} className="transition-smooth hover:shadow-elegant-md border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                      <relatorio.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                      {relatorio.frequencia}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {relatorio.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {relatorio.descricao}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={relatorio.acao}>
                      <Download className="w-4 h-4 mr-2" />
                      Gerar Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}