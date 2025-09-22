// Interface baseada no padrão UKO para clientes
export interface Customer {
  id: string;
  name: string;
  position?: string; // Cargo/Posição (opcional, adaptado do UKO)
  company?: string; // Empresa (opcional, adaptado do UKO)
  email: string;
  phone: string;
  cpfCnpj?: string; // CPF ou CNPJ do cliente
  avatar?: string; // URL para avatar

  // Campos específicos do RJChronos
  status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
  serialNumber: string;
  oltName: string;
  board: string;
  port: string;
  sinal: number;
  modo: 'routing' | 'bridge';
  vlan: string;
  voip: boolean;
  dataAutenticacao: string;
  tipoOnu: string;
  endereco: string;
  rxPower: number;
}

// Interface para colunas da tabela
export interface CustomerTableColumn {
  id: keyof Customer;
  numeric: boolean;
  disablePadding: boolean;
  label: string;
  sortable?: boolean;
}

// Interface para filtros
export interface CustomerFilters {
  searchTerm: string;
  status: string;
  oltName: string;
  board: string;
  port: string;
  vlan: string;
  tipoOnu: string;
  sinalQuality: string;
}

// Configuração das colunas da tabela
export const customerTableColumns: CustomerTableColumn[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: false,
    label: 'Name',
    sortable: true,
  },
  {
    id: 'position',
    numeric: false,
    disablePadding: false,
    label: 'Position',
    sortable: true,
  },
  {
    id: 'company',
    numeric: false,
    disablePadding: false,
    label: 'Company',
    sortable: true,
  },
  {
    id: 'email',
    numeric: false,
    disablePadding: false,
    label: 'Email',
    sortable: true,
  },
  {
    id: 'phone',
    numeric: false,
    disablePadding: false,
    label: 'Phone',
    sortable: true,
  },
];

// Configuração padrão dos filtros
export const defaultFilters: CustomerFilters = {
  searchTerm: '',
  status: 'all',
  oltName: 'all',
  board: 'all',
  port: 'all',
  vlan: 'all',
  tipoOnu: 'all',
  sinalQuality: 'all',
};
