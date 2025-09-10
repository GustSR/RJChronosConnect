// ONU Entity Types
export interface ONU {
  id: string;
  serialNumber: string;
  modelo: string;
  oltName: string;
  board: string;
  port: string;
  endereco: string;
  comentario?: string;
  vlan: string;
  status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
  sinal: number;
  dataAutorizacao: string;
}

export interface PendingONU {
  id: string;
  serialNumber: string;
  modelo: string;
  endereco: string;
  status: 'pending';
  dataDeteccao: string;
}
