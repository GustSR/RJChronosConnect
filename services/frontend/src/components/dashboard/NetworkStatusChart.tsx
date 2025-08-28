import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function NetworkStatusChart() {
  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            Status da Rede - Tempo Real
          </CardTitle>
          <div className="flex space-x-2">
            <Button size="sm" className="px-3 py-1 text-xs bg-primary text-white">
              24H
            </Button>
            <Button size="sm" variant="ghost" className="px-3 py-1 text-xs text-gray-400 hover:text-white">
              7D
            </Button>
            <Button size="sm" variant="ghost" className="px-3 py-1 text-xs text-gray-400 hover:text-white">
              30D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-dark-bg rounded-lg p-4 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <TrendingUp className="mx-auto text-3xl mb-2 w-12 h-12" />
            <p className="text-lg">Gráfico de Status em Tempo Real</p>
            <p className="text-sm">WebSocket connection: Active</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800/50 rounded p-3">
                <div className="text-success text-xl font-bold">98.5%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
              <div className="bg-gray-800/50 rounded p-3">
                <div className="text-primary text-xl font-bold">847</div>
                <div className="text-gray-400">Devices</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}