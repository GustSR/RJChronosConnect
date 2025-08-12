import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, TrendingUp, Zap } from "lucide-react";
import type { AIInsight } from "@shared/schema";

interface AIInsightsProps {
  insights: AIInsight[];
}

const mockInsights = [
  {
    id: "1",
    type: "prediction",
    title: "Previsão de Falha Detectada",
    description: "ONU-5678 apresenta degradação gradual do sinal. Falha prevista em 72h.",
    confidence: 87.5,
    createdAt: new Date(),
  },
  {
    id: "2",
    type: "anomaly",
    title: "Anomalia de Tráfego",
    description: "Pico anômalo de tráfego detectado no setor Norte às 14:30.",
    confidence: 92.1,
    createdAt: new Date(),
  },
  {
    id: "3",
    type: "recommendation",
    title: "Otimização Automática",
    description: "QoS ajustado automaticamente em 15 CPEs para melhorar performance.",
    confidence: 95.0,
    createdAt: new Date(),
  },
];

const typeConfig = {
  prediction: {
    icon: Lightbulb,
    color: "border-accent bg-accent/10",
    iconColor: "text-accent",
    actionColor: "text-accent",
  },
  anomaly: {
    icon: TrendingUp,
    color: "border-info bg-info/10",
    iconColor: "text-info",
    actionColor: "text-info",
  },
  recommendation: {
    icon: Zap,
    color: "border-success bg-success/10",
    iconColor: "text-success",
    actionColor: "text-success",
  },
};

export default function AIInsights({ insights }: AIInsightsProps) {
  const displayInsights = insights.length > 0 ? insights.slice(0, 3) : mockInsights;

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="text-accent w-5 h-5" />
            <CardTitle className="text-lg font-semibold text-white">IA Insights</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-accent">
            Beta
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayInsights.map((insight) => {
            const config = typeConfig[insight.type as keyof typeof typeConfig] || typeConfig.recommendation;
            const Icon = config.icon;
            
            return (
              <div 
                key={insight.id} 
                className={`p-4 rounded-lg border-l-4 ${config.color}`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`mt-1 w-5 h-5 ${config.iconColor}`} />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{insight.title}</p>
                    <p className="text-gray-400 text-sm">{insight.description}</p>
                    {insight.confidence && (
                      <p className="text-xs text-gray-500 mt-1">
                        Confiança: {insight.confidence.toFixed(1)}%
                      </p>
                    )}
                    <Button 
                      variant="link" 
                      className={`text-sm mt-2 hover:underline p-0 h-auto ${config.actionColor}`}
                    >
                      {insight.type === 'prediction' ? 'Tomar Ação' : 
                       insight.type === 'anomaly' ? 'Investigar' : 'Ver Detalhes'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
