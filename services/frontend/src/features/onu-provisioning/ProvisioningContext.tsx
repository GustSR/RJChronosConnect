import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { PendingONU, ProvisionedONU } from './provisioning';
import { mockProvisionedONUs } from '../../__fakeData__/provisioning';
import { genieacsApi } from '@shared/api/genieacsApi';

interface ProvisioningContextType {
  pendingONUs: PendingONU[];
  provisionedONUs: ProvisionedONU[];
  loading: boolean;
  error: string | null;
  provisionONU: (
    onuId: string,
    clientData: {
      client_name: string;
      client_cpf_cnpj?: string;
      client_address: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
    }
  ) => Promise<{ success: boolean; message?: string; genieacsAvailable?: boolean }>;
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

const getProvisionFailureMessage = (result: Record<string, unknown>): string => {
  const rawMessage =
    typeof result.message === 'string' ? result.message.trim() : '';
  if (rawMessage) {
    return rawMessage;
  }

  const details = result.details as
    | { olt?: { message?: string }; genieacs?: { message?: string } }
    | undefined;
  const oltMessage = details?.olt?.message;
  if (typeof oltMessage === 'string' && oltMessage.trim()) {
    return oltMessage.trim();
  }
  const genieacsMessage = details?.genieacs?.message;
  if (typeof genieacsMessage === 'string' && genieacsMessage.trim()) {
    return genieacsMessage.trim();
  }

  return 'Erro ao provisionar ONU';
};

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
        (item: Record<string, unknown>) => {
          const serialNumber = String(item.serial_number ?? '');
          const id = String(item.id ?? serialNumber);

          return {
            id,
            serialNumber,
          oltId: item.olt_id as number | undefined,
          oltName: String(item.olt_name ?? ''),
          oltPort: item.olt_port as string | undefined,
          frame: item.frame as number | undefined,
          slot: item.slot as number | undefined,
          ontId: item.ont_id as number | undefined,
          board: Number(item.board ?? 0),
          port: Number(item.port ?? 0),
          discoveredAt: String(item.discovered_at ?? new Date().toISOString()),
          distance: Number(item.distance ?? 0),
          onuType: String(item.onu_type ?? 'ONU'),
          status: (item.status as PendingONU['status']) ?? 'pending',
          rxPower: item.rx_power as number | undefined,
          temperature: item.temperature as number | undefined,
          };
        }
      );

      setPendingONUs(convertedPendingONUs);
    } catch (err) {
      console.error('Erro ao carregar ONUs pendentes:', err);
      setError('Erro ao carregar ONUs pendentes');
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
        (item: Record<string, unknown>) => {
          // Parse do pon_port (ex: "0/5/2")
          let frame = 0;
          let board = 1;
          let port = 1;
          
          if (typeof item.pon_port === 'string') {
            const parts = item.pon_port.split('/');
            if (parts.length === 3) {
              frame = parseInt(parts[0], 10);
              board = parseInt(parts[1], 10);
              port = parseInt(parts[2], 10);
            } else if (parts.length === 2) {
              // Formato 5/2 -> Slot 5, Port 2 (Assume frame 0)
              frame = 0;
              board = parseInt(parts[0], 10);
              port = parseInt(parts[1], 10);
            }
          }

          return {
            id:
              item.id != null
                ? String(item.id)
                : item.serial_number != null
                ? String(item.serial_number)
                : '',
            serialNumber:
              item.serial_number != null ? String(item.serial_number) : '',
            oltName: item.olt_id != null ? String(item.olt_id) : '', // OLT ID do backend
            board: board,
            port: port,
            frame: frame, // Adicionado se a interface suportar, mas usaremos board/port
            onuId: typeof item.ont_id === 'number' ? item.ont_id : parseInt(String(item.ont_id || 0), 10), // ID Real na OLT (ex: 28)
            authorizedAt: String(item.created_at || new Date().toISOString()),
            onuType: String(item.model || 'ONU'),

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
          };
        }
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
      client_cpf_cnpj?: string;
      client_address: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
    }
  ): Promise<{ success: boolean; message?: string; genieacsAvailable?: boolean }> => {
    try {
      setLoading(true);
      setError(null);

      // Chamar API para autorizar a ONU via Eventos (Async)
      const pendingONU = pendingONUs.find((onu) => onu.id === onuId);
      const result = await genieacsApi.authorizeONUAsync(onuId, {
        ...clientData,
        serial_number: pendingONU?.serialNumber,
        onu_type: pendingONU?.onuType,
        olt_id: pendingONU?.oltId,
        olt_port: pendingONU?.oltPort,
        frame: pendingONU?.frame,
        slot: pendingONU?.slot,
        board: pendingONU?.board,
        port: pendingONU?.port,
        ont_id: pendingONU?.ontId,
      });

      const isSuccess = result.success === true;
      const successMessage =
        typeof result.message === 'string' && result.message.trim()
          ? result.message.trim()
          : 'Solicitação de provisionamento enviada';

      if (isSuccess) {
        // Remover da lista de pendentes (ela sumirá do dashboard de pendentes)
        setPendingONUs((prev) => prev.filter((onu) => onu.id !== onuId));

        // Como é assíncrono, não recarregamos a lista de provisionadas imediatamente,
        // pois o worker ainda está processando. Em uma versão futura, o WebSocket
        // avisaria o frontend para atualizar.
        
        return { success: true, message: successMessage, genieacsAvailable: true };
      }

      return { success: false, message: failureMessage, genieacsAvailable };
    } catch (err) {
      console.error('Erro ao provisionar ONU:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao provisionar ONU';
      return { success: false, message: errorMessage };
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

export default ProvisioningProvider;
