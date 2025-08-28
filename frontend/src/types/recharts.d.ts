declare module 'recharts' {
  import * as React from 'react';

  export interface CartesianGridProps {
    strokeDasharray?: string;
    stroke?: string;
    [key: string]: any;
  }

  export interface XAxisProps {
    dataKey?: string;
    stroke?: string;
    [key: string]: any;
  }

  export interface YAxisProps {
    stroke?: string;
    [key: string]: any;
  }

  export interface TooltipProps {
    contentStyle?: React.CSSProperties;
    [key: string]: any;
  }

  export interface LineProps {
    type?: string;
    dataKey?: string;
    stroke?: string;
    strokeWidth?: number;
    dot?: any;
    name?: string;
    [key: string]: any;
  }

  export interface PieProps {
    data?: any[];
    cx?: string | number;
    cy?: string | number;
    outerRadius?: number;
    fill?: string;
    dataKey?: string;
    label?: any;
    [key: string]: any;
  }

  export interface CellProps {
    fill?: string;
    [key: string]: any;
  }

  export interface BarProps {
    dataKey?: string;
    fill?: string;
    radius?: number[];
    [key: string]: any;
  }

  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    children?: React.ReactNode;
  }

  export const LineChart: React.ComponentType<any>;
  export const Line: React.ComponentType<LineProps>;
  export const XAxis: React.ComponentType<XAxisProps>;
  export const YAxis: React.ComponentType<YAxisProps>;
  export const CartesianGrid: React.ComponentType<CartesianGridProps>;
  export const Tooltip: React.ComponentType<TooltipProps>;
  export const ResponsiveContainer: React.ComponentType<ResponsiveContainerProps>;
  export const PieChart: React.ComponentType<any>;
  export const Pie: React.ComponentType<PieProps>;
  export const Cell: React.ComponentType<CellProps>;
  export const BarChart: React.ComponentType<any>;
  export const Bar: React.ComponentType<BarProps>;
}
