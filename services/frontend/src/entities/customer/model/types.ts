// Customer Entity Types
export interface Customer {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco: string;
  plano: string;
  status: 'active' | 'inactive' | 'suspended';
  dataContratacao: string;
  onus: string[];
}

export interface CustomerDetails extends Customer {
  historico: CustomerHistoryEntry[];
  faturas: Invoice[];
}

export interface CustomerHistoryEntry {
  id: string;
  data: string;
  tipo: 'installation' | 'maintenance' | 'upgrade' | 'issue';
  descricao: string;
  tecnico?: string;
}

export interface Invoice {
  id: string;
  mes: string;
  valor: number;
  status: 'paid' | 'pending' | 'overdue';
  dataVencimento: string;
}
