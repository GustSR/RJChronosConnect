import { HttpClient, defaultApiConfig } from './api';
import type {
  AutofindOntSnmpInfo,
  GponPort,
  OltSnmpInfo,
  OntSnmpInfo,
  RouteReport,
  RouteReportRequest,
  SnmpWalkItem,
} from './oltManagerTypes';

const OLT_MANAGER_BASE_URL =
  process.env.REACT_APP_OLT_MANAGER_URL || '/olt-manager/api/v1';

const oltManagerClient = new HttpClient({
  ...defaultApiConfig,
  baseURL: OLT_MANAGER_BASE_URL,
  timeout: 120000,
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

  async getGponPorts(
    oltId: string | number,
    params?: { timeout?: number; retries?: number }
  ): Promise<GponPort[]> {
    return oltManagerClient.get<GponPort[]>(
      `/olts/${oltId}/ports/gpon`,
      params
    );
  }

  async getOntsOnPort(
    oltId: string | number,
    frame: number,
    slot: number,
    pon: number
  ): Promise<OntSnmpInfo[]> {
    return oltManagerClient.get<OntSnmpInfo[]>(
      `/olts/${oltId}/ports/${frame}/${slot}/${pon}/onts/all`
    );
  }

  async getRouteReport(
    oltId: string | number,
    payload: RouteReportRequest
  ): Promise<RouteReport> {
    return oltManagerClient.post<RouteReport>(`/olts/${oltId}/reports/route`, {
      ...payload,
      format: 'json',
    });
  }

  async downloadRouteReport(
    oltId: string | number,
    payload: RouteReportRequest
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(
      `${OLT_MANAGER_BASE_URL}/olts/${oltId}/reports/route`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Falha ao baixar relatorio (${response.status})`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const fallbackExt = payload.format === 'xml' ? 'xml' : 'xlsx';
    const filename = match?.[1] || `route-report-${oltId}.${fallbackExt}`;

    return { blob, filename };
  }
}

export const oltManagerApi = new OltManagerApiService();
