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
  const relatorios = [];

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
                    <Button size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Gerar PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Relatórios Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Inventário Completo - Janeiro 2024</h4>
                  <p className="text-sm text-muted-foreground">Gerado em 15/01/2024 às 14:30</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-warning-light rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Bens Inservíveis - Semana 02</h4>
                  <p className="text-sm text-muted-foreground">Gerado em 08/01/2024 às 09:15</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Relatório por Ambientes - Dezembro 2023</h4>
                  <p className="text-sm text-muted-foreground">Gerado em 29/12/2023 às 16:45</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}