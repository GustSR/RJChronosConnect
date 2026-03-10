import { Grid, Typography } from '@mui/material';
import type { ONUDetails } from '../../types';
import { mockGeneralInfo } from '../../mockData';

type Props = {
  onuDetails: ONUDetails;
};

export function GeneralPanel({ onuDetails }: Props) {
  const info = mockGeneralInfo;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Fabricante</Typography>
        <Typography variant="body1" fontWeight="500">{info.manufacturer}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Nome do modelo</Typography>
        <Typography variant="body1" fontWeight="500">{onuDetails.model}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Versão do Software</Typography>
        <Typography variant="body1" fontWeight="500">{info.softwareVersion}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Versão do hardware</Typography>
        <Typography variant="body1" fontWeight="500">{info.hardwareVersion}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Número de série</Typography>
        <Typography variant="body1" fontWeight="500">{onuDetails.serialNumber}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Temperatura do transceptor GPON</Typography>
        <Typography variant="body1" fontWeight="500">{onuDetails.temperature}°C</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Uso da CPU</Typography>
        <Typography variant="body1" fontWeight="500">{info.cpuUsage}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Total de RAM</Typography>
        <Typography variant="body1" fontWeight="500">{info.totalRam}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>RAM livre</Typography>
        <Typography variant="body1" fontWeight="500">{info.freeRam}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>Tempo de atividade</Typography>
        <Typography variant="body1" fontWeight="500">{info.uptime}</Typography>
      </Grid>
    </Grid>
  );
}
