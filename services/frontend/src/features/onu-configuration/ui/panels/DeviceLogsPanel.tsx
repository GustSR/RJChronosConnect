import { Box, Stack, Typography } from '@mui/material';

export function DeviceLogsPanel() {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Últimos eventos do sistema
      </Typography>
      <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
        <Stack spacing={1}>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            <strong>2024-01-15 16:30:25</strong> - Sistema iniciado
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            <strong>2024-01-15 16:30:45</strong> - WiFi configurado
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            <strong>2024-01-15 16:31:00</strong> - DHCP ativo
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            <strong>2024-01-15 16:31:15</strong> - Primeira conexão de cliente
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
