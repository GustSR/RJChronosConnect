import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DevicePerformance() {
  const metrics = [
    { name: "SNR Médio", value: "28.5 dB", percentage: 85, color: "bg-success" },
    { name: "Latência Média", value: "12ms", percentage: 90, color: "bg-success" },
    { name: "Disponibilidade", value: "99.8%", percentage: 99, color: "bg-success" },
    { name: "Throughput", value: "847 Mbps", percentage: 70, color: "bg-warning" },
  ];

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Performance de Dispositivos</CardTitle>
          <Select defaultValue="24h">
            <SelectTrigger className="w-40 bg-dark-bg border-gray-600 text-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-dark-bg border-gray-600">
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Última semana</SelectItem>
              <SelectItem value="30d">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{metric.name}</span>
                <span className="text-white">{metric.value}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${metric.color}`}
                  style={{ width: `${metric.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}