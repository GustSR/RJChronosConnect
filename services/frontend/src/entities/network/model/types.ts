// Network Entity Types
export interface OLT {
  id: string;
  nome: string;
  ip: string;
  modelo: string;
  localizacao: string;
  status: 'online' | 'offline' | 'maintenance';
  ultimaAtualizacao: string;
  boards: Board[];
  totalPorts: number;
  usedPorts: number;
}

export interface Board {
  id: string;
  numero: string;
  tipo: string;
  status: 'active' | 'inactive';
  ports: Port[];
}

export interface Port {
  id: string;
  numero: string;
  status: 'free' | 'occupied' | 'reserved';
  onuId?: string;
}

export interface NetworkMetrics {
  totalONUs: number;
  onlineONUs: number;
  offlineONUs: number;
  pendingONUs: number;
  averageSignal: number;
  bandwidthUsage: {
    upload: number;
    download: number;
    timestamp: string;
  }[];
}
