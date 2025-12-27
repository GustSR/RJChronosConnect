import { HttpClient, defaultApiConfig } from './api';
import type {
  AutofindOntSnmpInfo,
  OltSnmpInfo,
  SnmpWalkItem,
} from './oltManagerTypes';

const OLT_MANAGER_BASE_URL =
  process.env.REACT_APP_OLT_MANAGER_URL || '/olt-manager/api/v1';

const oltManagerClient = new HttpClient({
  ...defaultApiConfig,
  baseURL: OLT_MANAGER_BASE_URL,
});

class OltManagerApiService {
  async getOltSnmpInfo(oltId: string | number): Promise<OltSnmpInfo> {
    return oltManagerClient.get<OltSnmpInfo>(`/olts/${oltId}/snmp-info`);
  }

  async snmpWalk(
    oltId: string | number,
    params: { oid: string; limit?: number; contains?: string }
  ): Promise<SnmpWalkItem[]> {
    return oltManagerClient.get<SnmpWalkItem[]>(
      `/olts/${oltId}/snmp-walk`,
      params
    );
  }

  async getAutofindOntsSnmp(
    oltId: string | number,
    params?: { limit?: number; serial_number?: string; port?: string }
  ): Promise<AutofindOntSnmpInfo[]> {
    return oltManagerClient.get<AutofindOntSnmpInfo[]>(
      `/olts/${oltId}/autofind-onts/snmp`,
      params
    );
  }
}

export const oltManagerApi = new OltManagerApiService();
