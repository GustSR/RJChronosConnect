import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Skeleton,
  Alert,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  History,
  Refresh,
  Person,
  SmartToy,
  Router,
  Wifi,
  RestartAlt,
  Build,
  Key,
  DriveFileRenameOutline,
  CheckCircle,
  MoreVert,
  Visibility,
  Memory,
  AccountCircle,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BerryCard } from '../common';
import { useActivityHistory, useRecentActivities } from '../../hooks/useApi';
import type { ActivityLog, ActivityAction } from '../../types';

interface ActivityHistoryProps {
  showRecent?: boolean;
  deviceId?: string;
  maxItems?: number;
}

const actionIcons: Record<ActivityAction, React.ElementType> = {
  reboot_automatic: RestartAlt,
  reboot_manual: RestartAlt,
  firmware_update: Memory,
  configuration_change: Build,
  wifi_config_update: Wifi,
  wifi_channel_change: Wifi,
  provisioning: Router,
  factory_reset: RestartAlt,
  diagnostic_test: Build,
  backup_config: CheckCircle,
  restore_config: CheckCircle,
  alert_acknowledged: CheckCircle,
  maintenance_mode: Build,
  custom_script: Build,
  device_name_change: DriveFileRenameOutline,
  password_change: Key,
  user_credentials_change: AccountCircle,
  device_reboot: RestartAlt,
};

const actionColors: Record<ActivityAction, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  reboot_automatic: 'warning',
  reboot_manual: 'primary',
  firmware_update: 'info',
  configuration_change: 'secondary',
  wifi_config_update: 'info',
  wifi_channel_change: 'info',
  provisioning: 'success',
  factory_reset: 'error',
  diagnostic_test: 'secondary',
  backup_config: 'success',
  restore_config: 'warning',
  alert_acknowledged: 'success',
  maintenance_mode: 'warning',
  custom_script: 'secondary',
  device_name_change: 'info',
  password_change: 'warning',
  user_credentials_change: 'warning',
  device_reboot: 'primary',
};

const statusColors: Record<'success' | 'failure' | 'pending' | 'cancelled', 'success' | 'error' | 'warning' | 'default'> = {
  success: 'success',
  failure: 'error',
  pending: 'warning',
  cancelled: 'default',
};

const statusLabels: Record<'success' | 'failure' | 'pending' | 'cancelled', string> = {
  success: 'Sucesso',
  failure: 'Falha',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

const actionLabels: Record<ActivityAction, string> = {
  reboot_automatic: 'Reinício Automático',
  reboot_manual: 'Reinício Manual',
  firmware_update: 'Atualização de Firmware',
  configuration_change: 'Alteração de Configuração',
  wifi_config_update: 'Configuração WiFi',
  wifi_channel_change: 'Mudança de Canal WiFi',
  provisioning: 'Provisionamento',
  factory_reset: 'Reset de Fábrica',
  diagnostic_test: 'Teste de Diagnóstico',
  backup_config: 'Backup de Configuração',
  restore_config: 'Restaurar Configuração',
  alert_acknowledged: 'Alerta Reconhecido',
  maintenance_mode: 'Modo Manutenção',
  custom_script: 'Script Personalizado',
  device_name_change: 'Alteração de Nome',
  password_change: 'Alteração de Senha',
  user_credentials_change: 'Alteração de Credenciais',
  device_reboot: 'Reinicialização',
};

export default function ActivityHistory({ showRecent = false, deviceId, maxItems = 10 }: ActivityHistoryProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  // Use different hooks based on showRecent prop
  const { 
    data: activities, 
    isLoading, 
    error, 
    refetch 
  } = showRecent 
    ? useRecentActivities(maxItems) 
    : useActivityHistory({ deviceId, limit: maxItems });

  const handleActivityClick = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  const getExecutorDisplay = (activity: ActivityLog) => {
    if (activity.executedBy) {
      return {
        icon: <Person sx={{ fontSize: 16 }} />,
        text: activity.executedBy,
        color: 'primary.main'
      };
    }
    return {
      icon: <SmartToy sx={{ fontSize: 16 }} />,
      text: 'Sistema IA',
      color: 'secondary.main'
    };
  };

  // Use only API data - no mock data
  const displayActivities = activities || [];

  if (isLoading) {
    return (
      <BerryCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <History sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {showRecent ? 'Atividades Recentes' : 'Histórico de Alterações'}
            </Typography>
          </Box>
          <Stack spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="90%" height={16} />
                  <Skeleton variant="text" width="40%" height={14} />
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </BerryCard>
    );
  }

  return (
    <>
      <BerryCard>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <History sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {showRecent ? 'Atividades Recentes' : 'Histórico de Alterações'}
              </Typography>
              {displayActivities.length > 0 && (
                <Chip 
                  label={displayActivities.length} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Box>
            <Tooltip title="Atualizar">
              <IconButton size="small" onClick={() => refetch?.()}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Error/Connection message */}
          {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Conectando com GenieACS...</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aguardando dados do histórico de alterações dos dispositivos.
              </Typography>
            </Alert>
          )}

          {/* Activity List */}
          {displayActivities.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <History sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                {error ? 'Aguardando Conexão' : 'Nenhum Histórico'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {error 
                  ? 'Conectando com o GenieACS para buscar o histórico de alterações dos dispositivos'
                  : 'Nenhuma atividade de alteração de dispositivo foi registrada ainda'
                }
              </Typography>
              {error && (
                <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                  <Typography variant="caption">
                    <strong>Dados esperados do GenieACS:</strong><br/>
                    • Alterações de nome de dispositivos<br/>
                    • Mudanças de senhas e credenciais<br/>
                    • Reinicializações de equipamentos<br/>
                    • Configurações WiFi modificadas<br/>
                    • Alterações de parâmetros de rede
                  </Typography>
                </Alert>
              )}
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {displayActivities.map((activity: any, index: number) => {
                const ActionIcon = actionIcons[activity.action as ActivityAction] || Build;
                const executor = getExecutorDisplay(activity);
                
                return (
                  <ListItem
                    key={activity.id}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderBottom: index < displayActivities.length - 1 ? '1px solid' : 'none',
                      borderBottomColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                      }
                    }}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${actionColors[activity.action as ActivityAction] || 'primary'}.light`,
                          color: `${actionColors[activity.action as ActivityAction] || 'primary'}.dark`,
                          width: 36,
                          height: 36,
                        }}
                      >
                        <ActionIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      disableTypography
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {actionLabels[activity.action as ActivityAction] || activity.action}
                          </Typography>
                          <Chip
                            label={statusLabels[activity.status as keyof typeof statusLabels] || activity.status}
                            size="small"
                            color={statusColors[activity.status as keyof typeof statusColors] || 'default'}
                            sx={{ minWidth: 70, height: 20, fontSize: '0.75rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 0.5, lineHeight: 1.3 }}
                          >
                            {activity.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            {activity.deviceName && (
                              <Typography variant="caption" color="text.secondary">
                                📱 {activity.deviceName}
                              </Typography>
                            )}
                            
                            {activity.serialNumber && (
                              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                                SN: {activity.serialNumber}
                              </Typography>
                            )}
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {executor.icon}
                              <Typography variant="caption" sx={{ color: executor.color }}>
                                {executor.text}
                              </Typography>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(activity.timestamp), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </Typography>
                            
                            {activity.duration && (
                              <Typography variant="caption" color="text.secondary">
                                ⏱️ {activity.duration}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <MoreVert />
                    </IconButton>
                  </ListItem>
                );
              })}
            </List>
          )}

          {/* View More Button for Recent Activities */}
          {showRecent && displayActivities.length >= maxItems && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<Visibility />}
                onClick={() => {
                  // In a real app, this would navigate to history page
                  console.log('Navigate to full history');
                }}
              >
                Ver Histórico Completo
              </Button>
            </Box>
          )}
        </CardContent>
      </BerryCard>

      {/* Activity Detail Modal */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {selectedActivity && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: `${actionColors[selectedActivity.action as ActivityAction] || 'primary'}.light`,
                    color: `${actionColors[selectedActivity.action as ActivityAction] || 'primary'}.dark`,
                    width: 32,
                    height: 32,
                  }}
                >
                  {React.createElement(actionIcons[selectedActivity.action as ActivityAction] || Build, { sx: { fontSize: 16 } })}
                </Avatar>
                <Typography variant="h6">
                  {actionLabels[selectedActivity.action as ActivityAction] || selectedActivity.action}
                </Typography>
                <Chip
                  label={statusLabels[selectedActivity.status as keyof typeof statusLabels] || selectedActivity.status}
                  size="small"
                  color={statusColors[selectedActivity.status as keyof typeof statusColors] || 'default'}
                />
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.description}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Detalhes do Dispositivo</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedActivity.deviceName && (
                      <Typography variant="body2">
                        <strong>Dispositivo:</strong> {selectedActivity.deviceName}
                      </Typography>
                    )}
                    {selectedActivity.serialNumber && (
                      <Typography variant="body2">
                        <strong>Serial Number:</strong> 
                        <Typography component="span" sx={{ ml: 1, fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                          {selectedActivity.serialNumber}
                        </Typography>
                      </Typography>
                    )}
                    {selectedActivity.deviceId && (
                      <Typography variant="body2">
                        <strong>ID:</strong> {selectedActivity.deviceId}
                      </Typography>
                    )}
                    {selectedActivity.metadata?.ipAddress && (
                      <Typography variant="body2">
                        <strong>IP:</strong> {selectedActivity.metadata.ipAddress}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Data/Hora:</strong> {format(new Date(selectedActivity.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Executado por:</strong> {selectedActivity.executedBy || 'Sistema Automático'}
                    </Typography>
                    {selectedActivity.duration && (
                      <Typography variant="body2">
                        <strong>Duração:</strong> {selectedActivity.duration}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {selectedActivity.result && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Resultado</Typography>
                    <Typography variant="body2">
                      {selectedActivity.result}
                    </Typography>
                  </Grid>
                )}

                {selectedActivity.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Dados Técnicos</Typography>
                    <Box 
                      sx={{ 
                        bgcolor: 'grey.50', 
                        p: 2, 
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        maxHeight: 200,
                        overflow: 'auto'
                      }}
                    >
                      <pre>{JSON.stringify(selectedActivity.metadata, null, 2)}</pre>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
