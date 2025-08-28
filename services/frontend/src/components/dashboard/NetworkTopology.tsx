import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Cable, Radio } from "lucide-react";

export default function NetworkTopology() {
  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Topologia de Rede</CardTitle>
          <Button variant="link" className="text-sm text-primary hover:underline p-0">
            Visualização Completa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* OLT */}
          <div className="flex items-center space-x-3 p-3 bg-dark-bg rounded-lg">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Server className="text-primary w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">OLT-001</p>
              <p className="text-sm text-gray-400">16 PONs • 847 ONUs Ativas</p>
            </div>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </div>

          {/* PON Ports */}
          <div className="ml-6 space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg">
              <div className="w-6 h-6 bg-success/20 rounded flex items-center justify-center">
                <Cable className="text-success w-3 h-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">PON 1/1/1</p>
                <p className="text-xs text-gray-400">52 ONUs • 98% Uptime</p>
              </div>
              <span className="text-xs text-success">Active</span>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg">
              <div className="w-6 h-6 bg-warning/20 rounded flex items-center justify-center">
                <Cable className="text-warning w-3 h-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">PON 1/1/2</p>
                <p className="text-xs text-gray-400">45 ONUs • 92% Uptime</p>
              </div>
              <span className="text-xs text-warning">Warning</span>
            </div>

            <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg">
              <div className="w-6 h-6 bg-success/20 rounded flex items-center justify-center">
                <Cable className="text-success w-3 h-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">PON 1/1/3</p>
                <p className="text-xs text-gray-400">38 ONUs • 99% Uptime</p>
              </div>
              <span className="text-xs text-success">Active</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}