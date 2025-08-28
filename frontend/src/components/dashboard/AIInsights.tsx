import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, TrendingUp, Zap } from "lucide-react";

const mockInsights = [
  {
    id: 1,
    type: 'optimization',
    title: 'Otimização de Largura de Banda',
    description: 'Detectamos que 15% dos dispositivos estão utilizando mais de 80% da largura de banda disponível.',
    priority: 'high',
    impact: '+12% performance',
    icon: <TrendingUp size={16} />,
  },
  {
    id: 2,
    type: 'prediction',
    title: 'Previsão de Falha',
    description: 'Modelo indica 23% de chance de falha no setor Norte nas próximas 48h.',
    priority: 'medium',
    impact: 'Preventivo',
    icon: <Brain size={16} />,
  },
  {
    id: 3,
    type: 'recommendation',
    title: 'Recomendação de Upgrade',
    description: 'Sugerimos upgrade de firmware para 127 ONUs para melhor estabilidade.',
    priority: 'low',
    impact: '+8% estabilidade',
    icon: <Lightbulb size={16} />,
  },
];

const AIInsights: React.FC = () => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Typography variant="h6" className="text-white flex items-center gap-2">
          <Zap size={20} className="text-blue-400" />
          Insights de IA
        </Typography>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          Ver Todos
        </Button>
      </CardHeader>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mockInsights.map((insight) => (
            <Box
              key={insight.id}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: '#60a5fa' }}>
                    {insight.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                    {insight.title}
                  </Typography>
                </Box>
                <Chip
                  label={insight.priority.toUpperCase()}
                  size="small"
                  color={getPriorityColor(insight.priority) as any}
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Box>
              
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                {insight.description}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant="secondary" className="text-green-400 bg-green-400/10">
                  {insight.impact}
                </Badge>
                <Button variant="outline" size="sm" className="text-gray-300 border-gray-600 hover:bg-gray-700">
                  Aplicar
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIInsights;
