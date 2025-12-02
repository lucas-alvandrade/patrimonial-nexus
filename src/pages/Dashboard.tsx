import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Building2,
  Users,
  AlertCircle,
  Plus,
  TrendingUp,
  MapPin,
  CheckCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ambientesNaoIniciados: 0,
    ambientesEmAndamento: 0,
    ambientesConcluidos: 0,
    itensLocalizados: 0,
    totalBens: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Buscar todos os ambientes
      const { data: ambientes, error: ambientesError } = await supabase
        .from('ambientes')
        .select('id');

      if (ambientesError) throw ambientesError;

      // Buscar todos os inventários
      const { data: inventarios, error: inventariosError } = await supabase
        .from('inventarios')
        .select('status, ambiente_id');

      if (inventariosError) throw inventariosError;

      const totalAmbientes = ambientes?.length || 0;
      const inventariosMap = new Map(
        inventarios?.map(inv => [inv.ambiente_id, inv.status]) || []
      );

      // Contar por status
      let naoIniciados = 0;
      let emAndamento = 0;
      let concluidos = 0;

      ambientes?.forEach(ambiente => {
        const status = inventariosMap.get(ambiente.id) || 'nao_iniciado';
        if (status === 'nao_iniciado') naoIniciados++;
        else if (status === 'em_andamento') emAndamento++;
        else if (status === 'concluido') concluidos++;
      });

      // Buscar itens localizados únicos (por patrimônio)
      const { data: itensData, error: itensError } = await supabase
        .from('inventario_itens')
        .select('patrimonio');

      if (itensError) throw itensError;

      // Contar patrimônios únicos
      const patrimoniosUnicos = new Set(itensData?.map(item => item.patrimonio) || []);
      const itensCount = patrimoniosUnicos.size;

      // Buscar total de bens cadastrados
      const { count: bensCount, error: bensError } = await supabase
        .from('bens')
        .select('*', { count: 'exact', head: true });

      if (bensError) throw bensError;

      setStats({
        ambientesNaoIniciados: naoIniciados,
        ambientesEmAndamento: emAndamento,
        ambientesConcluidos: concluidos,
        itensLocalizados: itensCount,
        totalBens: bensCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const chartData = [
    { name: 'Não Iniciados', value: stats.ambientesNaoIniciados, color: '#ef4444' },
    { name: 'Em Andamento', value: stats.ambientesEmAndamento, color: '#eab308' },
    { name: 'Concluídos', value: stats.ambientesConcluidos, color: '#22c55e' }
  ];

  const itensChartData = [
    { name: 'Localizados', value: stats.itensLocalizados, color: '#22c55e' },
    { name: 'Não Localizados', value: Math.max(0, stats.totalBens - stats.itensLocalizados), color: '#ef4444' }
  ];

  const recentActivities = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de patrimônio
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Não Iniciados" 
          value={stats.ambientesNaoIniciados} 
          icon={AlertCircle}
          description="Ambientes pendentes"
        />
        <StatsCard 
          title="Em Andamento" 
          value={stats.ambientesEmAndamento} 
          icon={TrendingUp}
          description="Sendo inventariados"
        />
        <StatsCard 
          title="Concluídos" 
          value={stats.ambientesConcluidos} 
          icon={CheckCircle}
          description="Inventários finalizados"
        />
        <StatsCard 
          title="Itens Localizados" 
          value={`${stats.itensLocalizados}/${stats.totalBens}`} 
          icon={Package}
          description="Total de itens"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Ambientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Status dos Ambientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Itens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Progresso do Inventário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={itensChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {itensChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <div className="grid gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 transition-smooth hover:bg-muted">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'allocation' ? 'bg-primary-light' :
                    activity.type === 'creation' ? 'bg-success-light' :
                    'bg-warning-light'
                  }`}>
                    {activity.type === 'allocation' && <MapPin className="w-4 h-4 text-primary" />}
                    {activity.type === 'creation' && <Plus className="w-4 h-4 text-success" />}
                    {activity.type === 'update' && <CheckCircle className="w-4 h-4 text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.item}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        por {activity.user}
                      </span>
                      {activity.environment !== "-" && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {activity.environment}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}