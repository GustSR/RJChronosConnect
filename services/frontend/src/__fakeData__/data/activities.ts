// Activity History Mock Data
import { ActivityLog } from '../../services/types';

export const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    action: 'Provisionou ONT',
    description: 'Cliente: Maria Santos - ONT: ZTE-F670L',
    user_name: 'João Silva',
    status: 'success',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    task_name: 'provision_ont',
  },
  {
    id: '2',
    action: 'Alterou configuração WiFi',
    description: 'OLT-CENTRO-01 - Perfil de velocidade',
    user_name: 'Ana Costa',
    status: 'success',
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 min ago
    task_name: 'update_wifi_config',
  },
  {
    id: '3',
    action: 'Visualizou relatório',
    description: 'Relatório mensal de performance',
    user_name: 'Carlos Mendes',
    status: 'success',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    task_name: 'view_report',
  },
  {
    id: '4',
    action: 'Resetou ONT',
    description: 'Cliente: Pedro Oliveira - ONT: Huawei HG8245H',
    user_name: 'Lucia Pereira',
    status: 'success',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    task_name: 'reboot_ont',
  },
  {
    id: '5',
    action: 'Criou novo cliente',
    description: 'Cliente: Empresa TechCorp LTDA',
    user_name: 'Roberto Lima',
    status: 'success',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    task_name: 'create_customer',
  },
  {
    id: '6',
    action: 'Configurou VLAN',
    description: 'VLAN 100 configurada para cliente empresarial',
    user_name: 'Marina Santos',
    status: 'pending',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    task_name: 'configure_vlan',
  },
  {
    id: '7',
    action: 'Backup de configuração',
    description: 'Backup automático das configurações da OLT-001',
    user_name: 'Sistema',
    status: 'success',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    task_name: 'config_backup',
  },
  {
    id: '8',
    action: 'Falha na autorização',
    description: 'Tentativa de autorização de ONU rejeitada - Serial inválido',
    user_name: 'João Silva',
    status: 'failed',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    task_name: 'authorize_onu',
  },
];