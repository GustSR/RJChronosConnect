import { httpClient } from './api';
import type {
  ManagedOLT,
  OltCreatePayload,
  OltLiveInfo,
  OltUpdatePayload,
} from './oltManagementTypes';

const isConnected = (olt: ManagedOLT) =>
  Boolean(olt.discovered_at || olt.is_configured || olt.setup_status === 'configured');

class OltManagementApiService {
  async getOlts(options?: { connectedOnly?: boolean }): Promise<ManagedOLT[]> {
    const data = await httpClient.get<ManagedOLT[]>('/olts/');
    return options?.connectedOnly ? data.filter(isConnected) : data;
  }

  async getOltById(oltId: string | number): Promise<ManagedOLT | null> {
    return httpClient.get<ManagedOLT>(`/olts/${oltId}`);
  }

  async getOltLiveInfo(oltId: string | number): Promise<OltLiveInfo | null> {
    return httpClient.get<OltLiveInfo>(`/olts/${oltId}/live`);
  }

  async createOlt(payload: OltCreatePayload): Promise<ManagedOLT> {
    return httpClient.post<ManagedOLT>('/olts/', payload);
  }

  async updateOlt(
    oltId: string | number,
    payload: OltUpdatePayload
  ): Promise<ManagedOLT> {
    return httpClient.put<ManagedOLT>(`/olts/${oltId}`, payload);
  }

  async deleteOlt(oltId: string | number): Promise<void> {
    await httpClient.delete(`/olts/${oltId}`);
  }
}

export const oltManagementApi = new OltManagementApiService();
