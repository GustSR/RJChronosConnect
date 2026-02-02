import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { ONUDetails } from '../types';
import { httpClient } from '@shared/api/api';

interface WanTr069PanelProps {
  onuDetails: ONUDetails;
}

export default function WanTr069Panel({ onuDetails }: WanTr069PanelProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [mgmtVlan, setMgmtVlan] = useState<string>('200');
  const [tr069ProfileId, setTr069ProfileId] = useState<string>('2');
  const [ipMode, setIpMode] = useState<string>('dhcp');
  
  // Campos IP Estático
  const [ipAddress, setIpAddress] = useState<string>('');
  const [mask, setMask] = useState<string>('255.255.255.0');
  const [gateway, setGateway] = useState<string>('');

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Endpoint no OLT Manager (via proxy /olt-manager configurado no vite/nginx)
      const endpoint = `/olt-manager/api/v1/olts/${onuDetails.oltName}/onts/${onuDetails.id}/configure-wan`;
      
      const payload = {
        port: `0/${onuDetails.board}/${onuDetails.port}`, // Formato Frame/Slot/Porta
        mgmt_vlan: parseInt(mgmtVlan),
        tr069_profile_id: parseInt(tr069ProfileId),
        ip_mode: ipMode,
        ip_address: ipMode === 'static' ? ipAddress : undefined,
        mask: ipMode === 'static' ? mask : undefined,
        gateway: ipMode === 'static' ? gateway : undefined,
      };

      await httpClient.post(endpoint, payload);

      setSuccess('Configurações aplicadas com sucesso! A ONU deve reiniciar a conexão TR-069 em instantes.');
    } catch (err: any) {
      const message = err.message || 'Erro ao aplicar configurações. Verifique os logs do servidor.';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure a interface WAN de gerência para permitir que a ONU se comunique com o servidor GenieACS (TR-069).
            Essas configurações são aplicadas diretamente na OLT.
          </Typography>
        </Grid>

        {/* Configuração de VLAN e Profile */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Parâmetros de Rede de Gerência
              </Typography>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  label="VLAN de Gerência (MGMT)"
                  type="number"
                  value={mgmtVlan}
                  onChange={(e) => setMgmtVlan(e.target.value)}
                  helperText="Padrão: 200"
                  fullWidth
                />
                
                <TextField
                  label="ID do Perfil TR-069 (OLT)"
                  type="number"
                  value={tr069ProfileId}
                  onChange={(e) => setTr069ProfileId(e.target.value)}
                  helperText="ID do profile criado na OLT (Ex: 2 para GenieACS)"
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuração de IP */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Configuração de IP (WAN)
              </Typography>
              
              <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
                <RadioGroup
                  row
                  value={ipMode}
                  onChange={(e) => setIpMode(e.target.value)}
                >
                  <FormControlLabel value="dhcp" control={<Radio />} label="DHCP (Automático)" />
                  <FormControlLabel value="static" control={<Radio />} label="IP Estático" />
                </RadioGroup>
              </FormControl>

              {ipMode === 'static' && (
                <Stack spacing={2}>
                  <TextField
                    label="Endereço IP"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Ex: 10.200.0.50"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Máscara de Sub-rede"
                    value={mask}
                    onChange={(e) => setMask(e.target.value)}
                    placeholder="Ex: 255.255.255.0"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Gateway"
                    value={gateway}
                    onChange={(e) => setGateway(e.target.value)}
                    placeholder="Ex: 10.200.0.1"
                    fullWidth
                    required
                  />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Feedback e Ações */}
        <Grid item xs={12}>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    onClick={handleSave}
                    disabled={loading}
                    size="large"
                >
                    {loading ? 'Aplicando...' : 'Aplicar Configurações'}
                </Button>
            </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
