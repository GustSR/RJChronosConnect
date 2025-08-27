import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Power, Download, Wrench, Plus } from "lucide-react";
import type { ActionLog } from "@shared/schema";

interface RecentActionsProps {
  actions: ActionLog[];
}

const actionIcons = {
  reboot_automatic: Power,
  reboot_requested: Power,
  firmware_updated: Download,
  wifi_config_updated: Wrench,
  wifi_channel_automatic: Wrench,
  zero_touch_provisioning: Plus,
  default: Plus,
};

const actionColors = {
  reboot_automatic: "bg-success/20 text-success",
  reboot_requested: "bg-success/20 text-success",
  firmware_updated: "bg-info/20 text-info",
  wifi_config_updated: "bg-warning/20 text-warning",
  wifi_channel_automatic: "bg-warning/20 text-warning",
  zero_touch_provisioning: "bg-primary/20 text-primary",
  default: "bg-gray-600/20 text-gray-400",
};

const mockActions = [
  {
    id: "1",
    action: "reboot_automatic",
    description: "CPE-789 reiniciado após detecção de travamento",
    success: true,
    executedBy: null,
    createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
  },
  {
    id: "2",
    action: "firmware_updated",
    description: "Batch de 25 CPEs atualizado para v2.1.4",
    success: true,
    executedBy: "admin",
    createdAt: new Date(Date.now() - 75 * 60 * 1000), // 1h 15m ago
  },
  {
    id: "3",
    action: "wifi_config_updated",
    description: "Canal alterado de 6 para 11 - CPE-456",
    success: true,
    executedBy: "tecnico1",
    createdAt: new Date(Date.now() - 90 * 60 * 1000), // 1h 30m ago
  },
  {
    id: "4",
    action: "zero_touch_provisioning",
    description: "Novo CPE detectado e configurado automaticamente",
    success: true,
    executedBy: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
];

export default function RecentActions({ actions }: RecentActionsProps) {
  const displayActions = actions.length > 0 ? actions.slice(0, 4) : mockActions;

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Ações Recentes</CardTitle>
          <Button variant="link" className="text-sm text-primary hover:underline p-0">
            Histórico Completo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActions.map((action) => {
            const iconKey = action.action as keyof typeof actionIcons;
            const Icon = actionIcons[iconKey] || actionIcons.default;
            const colorClass = actionColors[iconKey] || actionColors.default;

            const actionTitles: Record<string, string> = {
              reboot_automatic: "Reboot Automático",
              reboot_requested: "Reboot Manual",
              firmware_updated: "Firmware Atualizado",
              wifi_config_updated: "Configuração WiFi",
              wifi_channel_automatic: "Canal WiFi Automático",
              zero_touch_provisioning: "Provisionamento Zero-Touch",
            };

            const title = actionTitles[action.action] || "Ação do Sistema";

            return (
              <div key={action.id} className="flex items-center space-x-3 p-3 bg-dark-bg rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{title}</p>
                  <p className="text-xs text-gray-400">{action.description}</p>
                  <p className="text-xs text-gray-500">
                    {action.createdAt 
                      ? formatDistanceToNow(new Date(action.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })
                      : "há alguns minutos"
                    } - Por: {action.executedBy || "Sistema IA"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
