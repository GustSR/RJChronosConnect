import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';
import { Box, Card, CardContent, Typography, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';
import { formatDate, formatLatency, formatBandwidth } from '@/utils';
import { MetricSeries } from '@/types';

interface AdvancedMetricsChartProps {
  data: MetricSeries[];
  title: string;
  height?: number;
  showBrush?: boolean;
  showReferenceLine?: boolean;
  referenceValue?: number;
  chartType?: 'line' | 'area';
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: string) => void;
  formatValue?: (value: number) => string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

const AdvancedMetricsChart: React.FC<AdvancedMetricsChartProps> = ({
  data,
  title,
  height = 300,
  showBrush = false,
  showReferenceLine = false,
  referenceValue,
  chartType = 'line',
  timeRange = '24h',
  onTimeRangeChange,
  formatValue = (value) => value.toString(),
  thresholds
}) => {
  const [selectedType, setSelectedType] = React.useState<'line' | 'area'>(chartType);

  const processedData = useMemo(() => {
    if (data.length === 0) return [];

    // Combine all series data by timestamp
    const timestampMap = new Map();
    
    data.forEach(series => {
      series.data.forEach(point => {
        const timestamp = point.timestamp.getTime();
        if (!timestampMap.has(timestamp)) {
          timestampMap.set(timestamp, { timestamp: point.timestamp });
        }
        timestampMap.get(timestamp)[series.name] = point.value;
      });
    });

    return Array.from(timestampMap.values()).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" gutterBottom>
              {formatDate(label, 'dd/MM HH:mm')}
            </Typography>
            {payload.map((entry: any, index: number) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: entry.color,
                    borderRadius: '50%'
                  }}
                />
                <Typography variant="body2">
                  {entry.name}: <strong>{formatValue(entry.value)}</strong>
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  const getStatusColor = (value: number) => {
    if (!thresholds) return '#2196f3';
    if (value >= thresholds.critical) return '#f44336';
    if (value >= thresholds.warning) return '#ff9800';
    return '#4caf50';
  };

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    if (selectedType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            {data.map((series, index) => (
              <linearGradient key={series.name} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={series.color || '#2196f3'} stopOpacity={0.8} />
                <stop offset="95%" stopColor={series.color || '#2196f3'} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(value) => formatDate(value, 'HH:mm')}
            stroke="#666"
          />
          <YAxis tickFormatter={formatValue} stroke="#666" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {data.map((series, index) => (
            <Area
              key={series.name}
              type="monotone"
              dataKey={series.name}
              stroke={series.color || '#2196f3'}
              fill={`url(#gradient-${index})`}
              strokeWidth={2}
            />
          ))}
          {showReferenceLine && referenceValue && (
            <ReferenceLine y={referenceValue} stroke="#ff9800" strokeDasharray="5 5" />
          )}
          {showBrush && <Brush dataKey="timestamp" height={30} />}
        </AreaChart>
      );
    }

    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(value) => formatDate(value, 'HH:mm')}
          stroke="#666"
        />
        <YAxis tickFormatter={formatValue} stroke="#666" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {data.map((series) => (
          <Line
            key={series.name}
            type="monotone"
            dataKey={series.name}
            stroke={series.color || '#2196f3'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: series.color || '#2196f3', strokeWidth: 2 }}
          />
        ))}
        {showReferenceLine && referenceValue && (
          <ReferenceLine y={referenceValue} stroke="#ff9800" strokeDasharray="5 5" />
        )}
        {showBrush && <Brush dataKey="timestamp" height={30} />}
      </LineChart>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {thresholds && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  size="small" 
                  label="Normal" 
                  sx={{ backgroundColor: '#4caf50', color: 'white' }} 
                />
                <Chip 
                  size="small" 
                  label="Atenção" 
                  sx={{ backgroundColor: '#ff9800', color: 'white' }} 
                />
                <Chip 
                  size="small" 
                  label="Crítico" 
                  sx={{ backgroundColor: '#f44336', color: 'white' }} 
                />
              </Box>
            )}
            
            <ToggleButtonGroup
              value={selectedType}
              exclusive
              onChange={(_, value) => value && setSelectedType(value)}
              size="small"
            >
              <ToggleButton value="line">Linha</ToggleButton>
              <ToggleButton value="area">Área</ToggleButton>
            </ToggleButtonGroup>

            {onTimeRangeChange && (
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={(_, value) => value && onTimeRangeChange(value)}
                size="small"
              >
                <ToggleButton value="1h">1h</ToggleButton>
                <ToggleButton value="6h">6h</ToggleButton>
                <ToggleButton value="24h">24h</ToggleButton>
                <ToggleButton value="7d">7d</ToggleButton>
                <ToggleButton value="30d">30d</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>
        </Box>

        <Box sx={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdvancedMetricsChart;