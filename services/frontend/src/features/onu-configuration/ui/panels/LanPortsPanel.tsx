import { Box, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { OutlinedCard } from '@shared/ui/components';
import { mockLanPorts } from '../../mockData';

export function LanPortsPanel() {
  return (
    <Box>
      <Stack spacing={3}>
        {mockLanPorts.map((port, index) => (
          <OutlinedCard key={port.name}>
            <CardContent sx={{ p: 2 }}>
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ mb: 2, color: 'primary.main' }}
              >
                Porta {index + 1} - LAN
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Nome</Typography>
                  <Typography variant="body1" fontWeight="500">{port.name}</Typography>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Ativo</Typography>
                  <Chip label={port.active ? 'Sim' : 'Não'} color={port.active ? 'success' : 'default'} size="small" />
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Status</Typography>
                  <Chip label={port.connected ? 'Conectado' : 'Desconectado'} color={port.connected ? 'success' : 'error'} size="small" />
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Velocidade</Typography>
                  <Typography variant="body1" fontWeight="500" color={port.connected ? 'text.primary' : 'text.secondary'}>{port.speed}</Typography>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Duplex</Typography>
                  <Typography variant="body1" fontWeight="500" color={port.connected ? 'text.primary' : 'text.secondary'}>{port.duplex}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </OutlinedCard>
        ))}
      </Stack>
    </Box>
  );
}
