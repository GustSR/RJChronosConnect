import { Grid, Typography } from '@mui/material';
import type { ONUDetails } from '../../types';

type Props = {
  onuDetails: ONUDetails;
};

export function GeneralPanel({ onuDetails }: Props) {
  return (
    <Grid
      container
      spacing={2}
      sx={{
        '& .MuiGrid-item': {
          transition: 'none !important',
          transform: 'none !important',
        },
      }}
    >
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Fabricante
        </Typography>
        <Typography variant="body1" fontWeight="500">
          ZTE Corporation
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Nome do modelo
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {onuDetails.model}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Versão do Software
        </Typography>
        <Typography variant="body1" fontWeight="500">
          V2.1.3_220825
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Versão do hardware
        </Typography>
        <Typography variant="body1" fontWeight="500">
          V1.0
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Número de série
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {onuDetails.serialNumber}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Temperatura do transceptor GPON
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {onuDetails.temperature}°C
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Uso da CPU
        </Typography>
        <Typography variant="body1" fontWeight="500">
          12%
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total de RAM
        </Typography>
        <Typography variant="body1" fontWeight="500">
          128 MB
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          RAM livre
        </Typography>
        <Typography variant="body1" fontWeight="500">
          95 MB
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Tempo de atividade
        </Typography>
        <Typography variant="body1" fontWeight="500">
          15 dias, 8 horas, 23 minutos
        </Typography>
      </Grid>
    </Grid>
  );
}
