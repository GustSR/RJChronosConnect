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

export type AutofindOntSnmpInfo = {
  serial_number?: string | null;
  ont_type?: string | null;
  state?: string | null;
  if_index?: number | null;
  port?: string | null;
  ont_id?: number | null;
  autofind_time?: string | null;
};
