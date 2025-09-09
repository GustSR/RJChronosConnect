import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { PendingONU, ProvisionedONU } from 'types/provisioning';
import { mockPendingONUs, mockProvisionedONUs } from '__fakeData__/provisioning';
import { genieacsApi } from '../api/genieacsApi';

interface ProvisioningContextType {
  pendingONUs: PendingONU[];
  provisionedONUs: ProvisionedONU[];
  loading: boolean;
  error: string | null;
  provisionONU: (
    onuId: string,
    clientData: {
      client_name: string;
      client_address: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
    }
  ) => Promise<boolean>;
  rejectONU: (onuId: string, reason?: string) => Promise<boolean>;
  updateProvisionedONU: (
    onuId: string,
    updates: Partial<ProvisionedONU>
  ) => void;
  refreshPendingONUs: () => Promise<void>;
  refreshProvisionedONUs: () => Promise<void>;
}

const ProvisioningContext = createContext<ProvisioningContextType | undefined>(
  undefined
);

export const useProvisioning = () => {
  const context = useContext(ProvisioningContext);
  if (!context) {
    throw new Error(
      'useProvisioning must be used within a ProvisioningProvider'
    );
  }
  return context;
};

interface ProvisioningProviderProps {
  children: ReactNode;
}

export const ProvisioningProvider: React.FC<ProvisioningProviderProps> = ({
  children,
}) => {
  const [pendingONUs, setPendingONUs] = useState<PendingONU[]>([]);
  const [provisionedONUs, setProvisionedONUs] = useState<ProvisionedONU[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar ONUs pendentes do backend
  const refreshPendingONUs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await genieacsApi.getPendingONUs();

      // Converter dados do backend para o formato esperado pelo frontend
      const convertedPendingONUs = data.map(
        (item: Record<string, unknown>) => ({
          id: item.id,
          serialNumber: item.serial_number,
          oltName: item.olt_name,
          board: item.board,
          port: item.port,
          discoveredAt: item.discovered_at,
          distance: item.distance || 0,
          onuType: item.onu_type,
          status: item.status,
          rxPower: item.rx_power,
          temperature: item.temperature,
        })
      );

      setPendingONUs(convertedPendingONUs);
    } catch (err) {
      console.error('Erro ao carregar ONUs pendentes:', err);
      setError('Erro ao carregar ONUs pendentes');
      // Fallback para dados mock em caso de erro
      setPendingONUs(mockPendingONUs);
    } finally {
      setLoading(false);
    }
  };

  // Carregar ONUs provisionadas do backend
  const refreshProvisionedONUs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await genieacsApi.getONUs();

      // Converter dados do backend para o formato esperado pelo frontend
      const convertedProvisionedONUs = data.map(
        (item: Record<string, unknown>) => ({
          id: item.id,
          serialNumber: item.serial_number,
          oltName: item.olt_id, // OLT ID do backend
          board: 1, // Seria extraído dos dados reais
          port: parseInt(item.pon_port?.split('/')[1]) || 1,
          onuId: Math.floor(Math.random() * 100) + 1,
          authorizedAt: item.created_at,
          onuType: item.model,

          // Dados do cliente (obtidos do backend após salvamento)
          clientName:
            item.customer_name || `Cliente ${item.serial_number?.slice(-4)}`,
          clientAddress: item.customer_address || 'Endereço não informado',
          comment: item.comment || '',

          // Status e monitoramento
          status: item.status === 'online' ? 'online' : 'offline',
          uptime: '0m', // Seria calculado
          onuRx: item.rx_power || -20,
          oltRx: (item.rx_power || -20) + 1,
          attachedVlans: [100], // Seria obtido dos dados reais
          onuMode: 'routing' as const,

          // Configuração de rede
          tr069Profile: 'default-profile',
          wanSetupMode: 'dhcp' as const,

          // Configurações padrão
          lanPorts: [
            { id: 1, enabled: true, mode: 'auto', description: 'LAN 1' },
            { id: 2, enabled: true, mode: 'auto', description: 'LAN 2' },
            { id: 3, enabled: true, mode: 'auto', description: 'LAN 3' },
            { id: 4, enabled: true, mode: 'auto', description: 'LAN 4' },
          ],

          wifiSettings: [
            {
              enabled: true,
              ssid: `WiFi_${item.serial_number?.slice(-4)}`,
              password: 'senha123',
              channel: 6,
              bandwidth: '20MHz',
              security: 'WPA2/WPA3',
              frequency: '2.4GHz',
            },
          ],

          voipEnabled: false,
          voipSettings: {
            sipServer: '',
            sipUser: '',
            sipPassword: '',
            displayName: '',
          },
        })
      );

      setProvisionedONUs(convertedProvisionedONUs);
    } catch (err) {
      console.error('Erro ao carregar ONUs provisionadas:', err);
      setError('Erro ao carregar ONUs provisionadas');
      // Fallback para dados mock em caso de erro
      setProvisionedONUs(mockProvisionedONUs);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    refreshPendingONUs();
    refreshProvisionedONUs();
  }, []);

  const provisionONU = async (
    onuId: string,
    clientData: {
      client_name: string;
      client_address: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
    }
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Chamar API para autorizar a ONU
      const result = await genieacsApi.authorizeONU(onuId, clientData);

      if (result.success) {
        // Remover da lista de pendentes
        setPendingONUs((prev) => prev.filter((onu) => onu.id !== onuId));

        // Recarregar lista de provisionadas para incluir a nova
        await refreshProvisionedONUs();

        return true;
      }

      return false;
    } catch (err) {
      console.error('Erro ao provisionar ONU:', err);
      setError('Erro ao provisionar ONU');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectONU = async (
    onuId: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Chamar API para rejeitar a ONU
      const result = await genieacsApi.rejectONU(onuId, reason);

      if (result.success) {
        // Remover da lista de pendentes
        setPendingONUs((prev) => prev.filter((onu) => onu.id !== onuId));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Erro ao rejeitar ONU:', err);
      setError('Erro ao rejeitar ONU');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProvisionedONU = (
    onuId: string,
    updates: Partial<ProvisionedONU>
  ) => {
    setProvisionedONUs((prev) =>
      prev.map((onu) => (onu.id === onuId ? { ...onu, ...updates } : onu))
    );
  };

  const value: ProvisioningContextType = {
    pendingONUs,
    provisionedONUs,
    loading,
    error,
    provisionONU,
    rejectONU,
    updateProvisionedONU,
    refreshPendingONUs,
    refreshProvisionedONUs,
  };

  return (
    <ProvisioningContext.Provider value={value}>
      {children}
    </ProvisioningContext.Provider>
  );
};
