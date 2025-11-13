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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ambientesNaoIniciados: 0,
    ambientesEmAndamento: 0,
    ambientesConcluidos: 0,
    itensLocalizados: 0,
    totalBens: 0
  });
  const [userItemsData, setUserItemsData] = useState<any[]>([]);
  const [userEnvironmentsData, setUserEnvironmentsData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchUserActivityData();
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

  const fetchUserActivityData = async () => {
    try {
      // Buscar itens inventariados por usuário
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventarios')
        .select(`
          concluido_por,
          usuarios!inventarios_concluido_por_fkey(nome),
          inventario_itens(id)
        `)
        .not('concluido_por', 'is', null);

      if (itemsError) throw itemsError;

      // Agrupar itens por usuário
      const itemsByUser = itemsData?.reduce((acc: any, inv: any) => {
        const userName = inv.usuarios?.nome || 'Desconhecido';
        if (!acc[userName]) {
          acc[userName] = 0;
        }
        acc[userName] += inv.inventario_itens?.length || 0;
        return acc;
      }, {});

      const itemsChartData = Object.entries(itemsByUser || {}).map(([name, count]) => ({
        name,
        itens: count
      }));

      setUserItemsData(itemsChartData);

      // Buscar ambientes por usuário com status
      const { data: envsData, error: envsError } = await supabase
        .from('inventarios')
        .select(`
          usuario_responsavel,
          status,
          ambientes(nome),
          usuarios!inventarios_usuario_responsavel_fkey(nome)
        `)
        .not('usuario_responsavel', 'is', null);

      if (envsError) throw envsError;

      // Agrupar ambientes por usuário e status
      const envsByUser = envsData?.reduce((acc: any, inv: any) => {
        const userName = inv.usuarios?.nome || 'Desconhecido';
        if (!acc[userName]) {
          acc[userName] = { em_andamento: 0, concluido: 0 };
        }
        if (inv.status === 'em_andamento') {
          acc[userName].em_andamento += 1;
        } else if (inv.status === 'concluido') {
          acc[userName].concluido += 1;
        }
        return acc;
      }, {});

      const envsChartData = Object.entries(envsByUser || {}).map(([name, counts]: [string, any]) => ({
        name,
        'Em Andamento': counts.em_andamento,
        'Concluído': counts.concluido
      }));

      setUserEnvironmentsData(envsChartData);
    } catch (error) {
      console.error('Error fetching user activity data:', error);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico 1: Itens Inventariados por Usuário */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Itens Inventariados por Usuário
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userItemsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="itens" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico 2: Ambientes por Usuário e Status */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Ambientes por Usuário
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userEnvironmentsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Em Andamento" fill="#eab308" />
                  <Bar dataKey="Concluído" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}