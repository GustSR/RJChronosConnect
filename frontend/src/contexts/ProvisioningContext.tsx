import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PendingONU, ProvisionedONU } from '../lib/provisioningData';
import { mockPendingONUs, mockProvisionedONUs } from '../lib/provisioningData';

interface ProvisioningContextType {
  pendingONUs: PendingONU[];
  provisionedONUs: ProvisionedONU[];
  provisionONU: (onuId: string, clientData?: Partial<ProvisionedONU>) => ProvisionedONU | null;
  updateProvisionedONU: (onuId: string, updates: Partial<ProvisionedONU>) => void;
  setPendingONUs: (onus: PendingONU[]) => void;
}

const ProvisioningContext = createContext<ProvisioningContextType | undefined>(undefined);

export const useProvisioning = () => {
  const context = useContext(ProvisioningContext);
  if (!context) {
    throw new Error('useProvisioning must be used within a ProvisioningProvider');
  }
  return context;
};

interface ProvisioningProviderProps {
  children: ReactNode;
}

export const ProvisioningProvider: React.FC<ProvisioningProviderProps> = ({ children }) => {
  const [pendingONUs, setPendingONUs] = useState<PendingONU[]>(mockPendingONUs);
  const [provisionedONUs, setProvisionedONUs] = useState<ProvisionedONU[]>(mockProvisionedONUs);

  const provisionONU = (onuId: string, clientData?: Partial<ProvisionedONU>) => {
    const pendingONU = pendingONUs.find(onu => onu.id === onuId);
    if (!pendingONU) return null;

    // Criar nova ONU provisionada baseada na pendente
    const newProvisionedONU: ProvisionedONU = {
      id: `provisioned-${Date.now()}`,
      serialNumber: pendingONU.serialNumber,
      oltName: pendingONU.oltName,
      board: pendingONU.board,
      port: pendingONU.port,
      onuId: Math.floor(Math.random() * 100) + 1, // ID automático
      authorizedAt: new Date().toISOString(),
      onuType: pendingONU.onuType,
      
      // Dados do cliente - usar serial number como nome padrão
      clientName: clientData?.clientName || pendingONU.serialNumber,
      clientAddress: clientData?.clientAddress || 'Endereço não informado',
      comment: clientData?.comment || '',
      
      // Status e monitoramento
      status: 'online',
      uptime: '0m',
      onuRx: pendingONU.rxPower || -20,
      oltRx: (pendingONU.rxPower || -20) + 1,
      attachedVlans: [100],
      onuMode: 'routing', // Valor padrão
      
      // Configuração de rede
      tr069Profile: 'default-profile',
      wanSetupMode: 'dhcp',
      
      // Configurações de portas LAN
      lanPorts: [
        { id: 1, enabled: true, mode: 'auto', description: 'LAN 1' },
        { id: 2, enabled: true, mode: 'auto', description: 'LAN 2' },
        { id: 3, enabled: true, mode: 'auto', description: 'LAN 3' },
        { id: 4, enabled: true, mode: 'auto', description: 'LAN 4' }
      ],
      
      // Configurações WiFi padrão
      wifiSettings: [
        {
          enabled: true,
          ssid: `WiFi_${pendingONU.serialNumber.slice(-4)}`,
          password: 'senha123',
          channel: 6,
          bandwidth: '20MHz',
          security: 'WPA2/WPA3',
          frequency: '2.4GHz'
        }
      ],

      // Configuração VoIP
      voipEnabled: false,
      voipSettings: {
        sipServer: '',
        sipUser: '',
        sipPassword: '',
        displayName: '',
      },
      
      ...clientData // Sobrescrever com dados fornecidos
    };

    // Adicionar à lista de provisionadas
    setProvisionedONUs(prev => [...prev, newProvisionedONU]);
    
    // Remover da lista de pendentes
    setPendingONUs(prev => prev.filter(onu => onu.id !== onuId));
    
    // Retornar a ONU provisionada para permitir redirecionamento
    return newProvisionedONU;
  };

  const updateProvisionedONU = (onuId: string, updates: Partial<ProvisionedONU>) => {
    setProvisionedONUs(prev => 
      prev.map(onu => 
        onu.id === onuId ? { ...onu, ...updates } : onu
      )
    );
  };

  const value: ProvisioningContextType = {
    pendingONUs,
    provisionedONUs,
    provisionONU,
    updateProvisionedONU,
    setPendingONUs,
  };

  return (
    <ProvisioningContext.Provider value={value}>
      {children}
    </ProvisioningContext.Provider>
  );
};