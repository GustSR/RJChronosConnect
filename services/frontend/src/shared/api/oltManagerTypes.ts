export type OltSnmpInfo = {
  sys_descr?: string | null;
  sys_object_id?: string | null;
  sys_uptime?: string | null;
  sys_name?: string | null;
};

export type SnmpWalkItem = {
  oid: string;
  value: string;
  value_hex?: string | null;
  value_text?: string | null;
};

export type GponPort = {
  if_index: number;
  if_name?: string | null;
  port?: string | null;
  frame?: number | null;
  slot?: number | null;
  pon?: number | null;
};

export type OntSnmpInfo = {
  port: string;
  ont_id: number;
  serial_number: string;
  if_index?: number | null;
  description?: string | null;
  distance_m?: string | null;
  online_state?: string | null;
  last_down_cause?: string | null;
};

export type AutofindOntSnmpInfo = {
  serial_number?: string | null;
  ont_type?: string | null;
  state?: string | null;
  if_index?: number | null;
  port?: string | null;
  ont_id?: number | null;
  autofind_time?: string | null;
};

export type RouteReportSummary = {
  olt_id: number;
  if_index: number;
  port?: string | null;
  slot?: number | null;
  pon?: number | null;
  los_count: number;
  classification: string;
  generated_at: string;
};

export type RouteReportOnu = {
  customer_name?: string | null;
  contract?: string | null;
  equipment_sn?: string | null;
  actual_sn?: string | null;
  rx_power_dbm?: number | null;
  last_down_time?: string | null;
  last_down_cause?: string | null;
  if_index: number;
  ont_index: number;
  port?: string | null;
  slot?: number | null;
  pon?: number | null;
};

export type RouteReport = {
  summary: RouteReportSummary;
  onus: RouteReportOnu[];
};

export type RouteReportRequest = {
  frame?: number;
  slot?: number;
  pon?: number;
  port?: string;
  if_index?: number;
  los_threshold?: number;
  format?: 'json' | 'xlsx' | 'xml';
  timeout?: number;
  retries?: number;
};
