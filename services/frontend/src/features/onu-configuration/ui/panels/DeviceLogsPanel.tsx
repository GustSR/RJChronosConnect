import { Box, Stack, Typography } from '@mui/material';
import { mockDeviceLogs } from '../../mockData';

export function DeviceLogsPanel() {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Últimos eventos do sistema
      </Typography>
      <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
        <Stack spacing={1}>
          {mockDeviceLogs.map((log) => (
            <Typography
              key={log.timestamp}
              variant="body2"
              sx={{ fontFamily: 'monospace', fontSize: '12px' }}
            >
              <strong>{log.timestamp}</strong> - {log.message}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
