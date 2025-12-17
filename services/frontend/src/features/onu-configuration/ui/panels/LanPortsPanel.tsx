import { Box, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { OutlinedCard } from '@shared/ui/components';

export function LanPortsPanel() {
  return (
    <Box>
      <Stack spacing={3}>
        <OutlinedCard>
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Porta 1 - LAN
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nome
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  LAN1
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ativo
                </Typography>
                <Chip label="Sim" color="success" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip label="Conectado" color="success" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Velocidade
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  1000 Mbps
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duplex
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  Full
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </OutlinedCard>

        <OutlinedCard>
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Porta 2 - LAN
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nome
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  LAN2
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ativo
                </Typography>
                <Chip label="Não" color="default" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip label="Desconectado" color="error" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Velocidade
                </Typography>
                <Typography variant="body1" fontWeight="500" color="text.secondary">
                  -
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duplex
                </Typography>
                <Typography variant="body1" fontWeight="500" color="text.secondary">
                  -
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </OutlinedCard>

        <OutlinedCard>
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Porta 3 - LAN
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nome
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  LAN3
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ativo
                </Typography>
                <Chip label="Sim" color="success" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip label="Conectado" color="success" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Velocidade
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  100 Mbps
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duplex
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  Full
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </OutlinedCard>

        <OutlinedCard>
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Porta 4 - LAN
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nome
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  LAN4
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ativo
                </Typography>
                <Chip label="Não" color="default" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip label="Desconectado" color="error" size="small" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Velocidade
                </Typography>
                <Typography variant="body1" fontWeight="500" color="text.secondary">
                  -
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duplex
                </Typography>
                <Typography variant="body1" fontWeight="500" color="text.secondary">
                  -
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </OutlinedCard>
      </Stack>
    </Box>
  );
}
