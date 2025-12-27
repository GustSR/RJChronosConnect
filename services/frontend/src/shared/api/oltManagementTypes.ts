export type OltSetupStatus =
  | 'pending'
  | 'in_progress'
  | 'configured'
  | 'failed';

export type ManagedOLT = {
  id: number | string;
  name: string;
  ip_address: string;
  vendor?: string | null;
  model?: string | null;
  ssh_username?: string | null;
  ssh_port?: number | null;
  setup_status: OltSetupStatus;
  is_configured: boolean;
  discovered_at?: string | null;
  last_sync_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type OltLiveInfo = {
  olt_id: number | string;
  reachable: boolean;
  version?: string | null;
  sysname?: string | null;
  errors?: Record<string, string>;
};

export type OltCreatePayload = {
  name: string;
  ip_address: string;
  vendor?: string | null;
  model?: string | null;
  snmp_community?: string | null;
  ssh_username?: string | null;
  ssh_password?: string | null;
  ssh_port?: number | null;
};

export type OltUpdatePayload = {
  name?: string | null;
  ip_address?: string | null;
  vendor?: string | null;
  model?: string | null;
  snmp_community?: string | null;
  ssh_username?: string | null;
  ssh_password?: string | null;
  ssh_port?: number | null;
  setup_status?: OltSetupStatus;
  is_configured?: boolean;
};
