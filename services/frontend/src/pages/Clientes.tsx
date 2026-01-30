import type { Customer } from '@entities/customer/model/customerTypes';
import { CustomersPage, getRandomAvatarPath } from '@features/customer';
import { genieacsApi } from '@shared/api/genieacsApi';
import type { Subscriber, SubscriberCreate, SubscriberUpdate } from '@shared/api/types';
import { useTitle } from '@shared/lib/hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Clientes: React.FC = () => {
  useTitle('Clientes');

  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar subscribers da API
  const loadSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await genieacsApi.getSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  // Converter subscriber para formato Customer
  const convertSubscriberToCustomer = useCallback((subscriber: Subscriber): Customer => {
    return {
      id: String(subscriber.id),
      name: subscriber.full_name,
      position: 'Subscriber',
      company: 'Telecom',
      email: subscriber.email || '-',
      phone: subscriber.phone_number || '-',
      cpfCnpj: subscriber.cpf_cnpj,
      avatar: getRandomAvatarPath(),
      
      // Campos padrão (não aplicáveis a subscribers puros)
      status: 'online' as const,
      serialNumber: '-',
      oltName: '-',
      board: '-',
      port: '-',
      sinal: 0,
      modo: 'routing' as const,
      vlan: '-',
      voip: false,
      dataAutenticacao: subscriber.created_at,
      tipoOnu: '-',
      endereco: subscriber.address_street || '-',
      rxPower: 0,
    };
  }, []);

  const customers = useMemo(
    () => subscribers.map(convertSubscriberToCustomer),
    [subscribers, convertSubscriberToCustomer]
  );

  const handleViewCustomer = useCallback(
    (customerId: string) => navigate(`/clientes/${customerId}`),
    [navigate]
  );

  // Criar novo subscriber
  const handleCreateCustomer = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      email: string;
      cpfCnpj: string;
      phone: string;
      address: string;
    }) => {
      try {
        const subscriberData: SubscriberCreate = {
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          cpf_cnpj: data.cpfCnpj,
          email: data.email || undefined,
          phone_number: data.phone || undefined,
          address_street: data.address || undefined,
        };

        await genieacsApi.createSubscriber(subscriberData);
        await loadSubscribers(); // Recarregar lista
        return { success: true };
      } catch (err) {
        console.error('Erro ao criar cliente:', err);
        return { success: false, error: 'Erro ao criar cliente' };
      }
    },
    [loadSubscribers]
  );

  // Atualizar subscriber existente
  const handleUpdateCustomer = useCallback(
    async (
      customerId: string,
      data: {
        firstName: string;
        lastName: string;
        email: string;
        cpfCnpj: string;
        phone: string;
      }
    ) => {
      try {
        const subscriberData: SubscriberUpdate = {
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          cpf_cnpj: data.cpfCnpj,
          email: data.email || undefined,
          phone_number: data.phone || undefined,
        };

        await genieacsApi.updateSubscriber(Number(customerId), subscriberData);
        await loadSubscribers(); // Recarregar lista
        return { success: true };
      } catch (err) {
        console.error('Erro ao atualizar cliente:', err);
        return { success: false, error: 'Erro ao atualizar cliente' };
      }
    },
    [loadSubscribers]
  );

  // Deletar subscriber
  const handleDeleteCustomer = useCallback(
    async (customerId: string) => {
      try {
        await genieacsApi.deleteSubscriber(Number(customerId));
        await loadSubscribers(); // Recarregar lista
        return { success: true };
      } catch (err) {
        console.error('Erro ao excluir cliente:', err);
        return { success: false, error: 'Erro ao excluir cliente' };
      }
    },
    [loadSubscribers]
  );

  return (
    <CustomersPage
      customers={customers}
      loading={loading}
      error={error}
      onViewCustomer={handleViewCustomer}
      onCreateCustomer={handleCreateCustomer}
      onUpdateCustomer={handleUpdateCustomer}
      onDeleteCustomer={handleDeleteCustomer}
    />
  );
};

export default Clientes;
