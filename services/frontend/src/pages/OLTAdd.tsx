import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NetworkCheck as TestIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { H3, H5 } from '@shared/ui/components/Typography';
import FlexBox from '@shared/ui/components/FlexBox';
import { useTitle } from '@shared/lib/hooks';
import { AnimatedCard } from '@shared/ui/components';

interface OLTFormData {
  name: string;
  ip_address: string;
  telnet_tcp_port: string;
  telnet_username: string;
  telnet_password: string;
  snmp_read_community: string;
  snmp_read_write_community: string;
  snmp_udp_port: string;
  iptv_enabled: boolean;
  hardware_version: string;
  software_version: string;
  supported_pon_types: string;
}

const OLTAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useTitle('Adicionar OLT - RJ Chronos');

  const [formData, setFormData] = useState<OLTFormData>({
    name: '',
    ip_address: '',
    telnet_tcp_port: '2333',
    telnet_username: '',
    telnet_password: '',
    snmp_read_community: 'Wojcyd51ktCb',
    snmp_read_write_community: 'hGjb3semv2uH',
    snmp_udp_port: '2161',
    iptv_enabled: false,
    hardware_version: 'Huawei-EA5800-X2',
    software_version: 'R008',
    supported_pon_types: 'GPON',
  });

  const handleInputChange =
    (field: keyof OLTFormData) =>
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: any
    ) => {
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implementar teste de conexão com a API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulando teste
      setSuccess('Conexão testada com sucesso!');
    } catch {
      setError('Erro ao testar conexão com a OLT');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implementar API para criar OLT
      // await genieacsApi.createOLT(formData);
      console.log('Dados da OLT:', formData);

      // Simular sucesso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('OLT adicionada com sucesso!');

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/olts');
      }, 2000);
    } catch (err) {
      setError('Erro ao adicionar OLT');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const hardwareVersions = [
    'Huawei-EA5800-X2',
    'Huawei-MA5800-X2',
    'Huawei-MA5800-X15',
    'Huawei-MA5800-X7',
    'ZTE-C300',
    'ZTE-C320',
    'Fiberhome-AN5516',
  ];

  const softwareVersions = ['R008', 'R018', 'R019', 'R020', 'R022'];

  return (
    <Box p={3}>
      {/* Header */}
      <AnimatedCard delay={100}>
        <FlexBox alignItems="center" mb={3} p={3}>
          <IconButton onClick={() => navigate('/olts')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <H3 mb={0}>Adicionar Nova OLT</H3>
            <Typography color="text.secondary" mt={1}>
              Configure uma nova Optical Line Terminal
            </Typography>
          </Box>
        </FlexBox>
      </AnimatedCard>

      {/* Success/Error Messages */}
      {success && (
        <AnimatedCard delay={200}>
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        </AnimatedCard>
      )}

      {error && (
        <AnimatedCard delay={200}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </AnimatedCard>
      )}

      <AnimatedCard delay={300}>
        <Card>
          <Box p={3}>
            <form onSubmit={handleSubmit}>
              {/* Informações Básicas */}
              <H5 mb={3}>Informações Básicas</H5>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome da OLT"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    required
                    placeholder="Ex: OLT-COELHO-NETO"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="IP da OLT ou FQDN"
                    value={formData.ip_address}
                    onChange={handleInputChange('ip_address')}
                    required
                    placeholder="Ex: 172.17.19.25"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Porta Telnet TCP"
                    value={formData.telnet_tcp_port}
                    onChange={handleInputChange('telnet_tcp_port')}
                    required
                    type="number"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FlexBox alignItems="center" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<TestIcon />}
                      onClick={handleTestConnection}
                      disabled={!formData.ip_address || testingConnection}
                      sx={{ minWidth: 160 }}
                    >
                      {testingConnection ? 'Testando...' : 'Testar Conexão'}
                    </Button>
                  </FlexBox>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 4 }} />

              {/* Credenciais */}
              <H5 mb={3}>Credenciais de Acesso</H5>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Usuário Telnet"
                    value={formData.telnet_username}
                    onChange={handleInputChange('telnet_username')}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Senha Telnet"
                    type="password"
                    value={formData.telnet_password}
                    onChange={handleInputChange('telnet_password')}
                    required
                  />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 4 }} />

              {/* Configurações SNMP */}
              <H5 mb={3}>Configurações SNMP</H5>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SNMP Read-only Community"
                    value={formData.snmp_read_community}
                    onChange={handleInputChange('snmp_read_community')}
                    helperText="Será criada automaticamente na OLT"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SNMP Read-write Community"
                    value={formData.snmp_read_write_community}
                    onChange={handleInputChange('snmp_read_write_community')}
                    helperText="Será criada automaticamente na OLT"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Porta SNMP UDP"
                    value={formData.snmp_udp_port}
                    onChange={handleInputChange('snmp_udp_port')}
                    type="number"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.iptv_enabled}
                        onChange={handleInputChange('iptv_enabled')}
                      />
                    }
                    label="Habilitar módulo IPTV"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 4 }} />

              {/* Especificações Técnicas */}
              <H5 mb={3}>Especificações Técnicas</H5>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Versão de Hardware da OLT</InputLabel>
                    <Select
                      value={formData.hardware_version}
                      onChange={handleInputChange('hardware_version')}
                      label="Versão de Hardware da OLT"
                    >
                      {hardwareVersions.map((version) => (
                        <MenuItem key={version} value={version}>
                          {version}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Versão de Software da OLT</InputLabel>
                    <Select
                      value={formData.software_version}
                      onChange={handleInputChange('software_version')}
                      label="Versão de Software da OLT"
                    >
                      {softwareVersions.map((version) => (
                        <MenuItem key={version} value={version}>
                          {version}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipos de PON Suportados</InputLabel>
                    <Select
                      value={formData.supported_pon_types}
                      onChange={handleInputChange('supported_pon_types')}
                      label="Tipos de PON Suportados"
                    >
                      <MenuItem value="GPON">GPON</MenuItem>
                      <MenuItem value="EPON">EPON</MenuItem>
                      <MenuItem value="GPON+EPON">GPON+EPON</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Botões de Ação */}
              <FlexBox justifyContent="space-between" mt={4}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/olts')}
                  disabled={loading}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar OLT'}
                </Button>
              </FlexBox>
            </form>
          </Box>
        </Card>
      </AnimatedCard>
    </Box>
  );
};

export default OLTAdd;
