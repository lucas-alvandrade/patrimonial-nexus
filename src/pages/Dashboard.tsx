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

export default function Dashboard() {
  const stats = [];

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
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
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