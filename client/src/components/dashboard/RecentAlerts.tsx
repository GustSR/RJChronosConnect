import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Alert } from "@shared/schema";

interface RecentAlertsProps {
  alerts: Alert[];
}

const severityColors = {
  info: "bg-info",
  warning: "bg-warning",
  error: "bg-error",
  critical: "bg-error",
};

const mockAlerts = [
  {
    id: "1",
    severity: "error" as const,
    title: "CPE Offline",
    description: "192.168.1.100 - Cliente: João Silva",
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: "2",
    severity: "warning" as const,
    title: "Sinal Óptico Baixo",
    description: "ONU-1234 - Potência: -27dBm",
    createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
  },
  {
    id: "3",
    severity: "info" as const,
    title: "Firmware Atualizado",
    description: "25 CPEs atualizados com sucesso",
    createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: "4",
    severity: "error" as const,
    title: "Falha de Comunicação TR-069",
    description: "CPE não responde há 30 minutos",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
];

export default function RecentAlerts({ alerts }: RecentAlertsProps) {
  const displayAlerts = alerts.length > 0 ? alerts.slice(0, 5) : mockAlerts.slice(0, 4);

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Alertas Recentes</CardTitle>
          <Button variant="link" className="text-sm text-primary hover:underline p-0">
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 bg-dark-bg rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${severityColors[alert.severity]}`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{alert.title}</p>
                <p className="text-xs text-gray-400 truncate">{alert.description}</p>
                <p className="text-xs text-gray-500">
                  {alert.createdAt 
                    ? formatDistanceToNow(new Date(alert.createdAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })
                    : "há alguns minutos"
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
