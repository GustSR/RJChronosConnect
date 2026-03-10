import { useState, useEffect } from 'react';
import { useProvisioning } from '@features/onu-provisioning';
import type { ONUDetails } from '../types';

export function useONUDetails(id: string | undefined) {
  const { provisionedONUs } = useProvisioning();
  const [onuDetails, setOnuDetails] = useState<ONUDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const onu = provisionedONUs.find((o) => o.id === id);

    if (onu) {
      setOnuDetails({
        id: onu.id,
        serialNumber: onu.serialNumber,
        model: onu.onuType,
        customerName: onu.clientName,
        oltName: onu.oltName,
        board: String(onu.board),
        port: String(onu.port),
        ontId: onu.onuId,
        status: onu.status === 'disabled' ? 'offline' : onu.status,
        authorizedAt: onu.authorizedAt,
        ip: '192.168.2.1',
        temperature: 45,
      });
    }

    setLoading(false);
  }, [id, provisionedONUs]);

  return { onuDetails, loading };
}
