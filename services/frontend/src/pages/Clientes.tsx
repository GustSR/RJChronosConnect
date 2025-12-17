import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomersPage, getRandomAvatarPath } from '@features/customer';
import type { Customer } from '@entities/customer/model/customerTypes';
import { useProvisioning } from '@features/onu-provisioning';
import type { ProvisionedONU } from '@features/onu-provisioning/provisioning';
import { useTitle } from '@shared/lib/hooks';

const Clientes: React.FC = () => {
  useTitle('Clientes - RJ Chronos');

  const navigate = useNavigate();
  const { provisionedONUs } = useProvisioning();

  const convertProvisionedToCustomer = useCallback((onu: ProvisionedONU): Customer => {
    const status =
      onu.status === 'disabled' ? 'admin_disabled' : (onu.status as Customer['status']);

    return {
      id: onu.id,
      name: onu.clientName,
      position: 'Subscriber',
      company: 'Telecom',
      email: `${onu.clientName.toLowerCase().replace(/\\s+/g, '.')}@example.com`,
      phone: '(21) 9999-9999',
      cpfCnpj: Math.random() > 0.5 ? '123.456.789-00' : '12.345.678/0001-90',
      avatar: getRandomAvatarPath(),

      status,
      serialNumber: onu.serialNumber,
      oltName: onu.oltName,
      board: `${onu.board}/${onu.port}`,
      port: onu.port.toString(),
      sinal: onu.onuRx,
      modo: onu.onuMode,
      vlan: onu.attachedVlans.join(','),
      voip: onu.voipEnabled || false,
      dataAutenticacao: onu.authorizedAt,
      tipoOnu: onu.onuType,
      endereco: onu.clientAddress,
      rxPower: onu.onuRx,
    };
  }, []);

  const customers = useMemo(() => provisionedONUs.map(convertProvisionedToCustomer), [provisionedONUs, convertProvisionedToCustomer]);

  const handleViewCustomer = useCallback((customerId: string) => navigate(`/clientes/${customerId}`), [navigate]);

  return <CustomersPage customers={customers} onViewCustomer={handleViewCustomer} />;
};

export default Clientes;
