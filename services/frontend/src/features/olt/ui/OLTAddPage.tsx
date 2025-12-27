import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CardContent,
  Container,
  Grid,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  AnimatedCard,
  FlexBox,
  LabeledSelect,
  LabeledTextField,
} from '@shared/ui/components';
import React, { useCallback, useMemo, useState } from 'react';
import { oltManagementApi } from '@shared/api/oltManagementApi';
import { oltManagerApi } from '@shared/api/oltManagerApi';

export interface OLTFormData {
  name: string;
  ip_address: string;
  vendor: string;
  model: string;
  snmp_community: string;
  ssh_username: string;
  ssh_password: string;
  ssh_port: string;
}

type Props = {
  onCancel?: () => void;
  onSuccessNavigate?: () => void;
};

export const OLTAddPage: React.FC<Props> = ({ onCancel, onSuccessNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<OLTFormData>({
    name: '',
    ip_address: '',
    vendor: 'Huawei',
    model: '',
    snmp_community: '',
    ssh_username: '',
    ssh_password: '',
    ssh_port: '22',
  });

  const vendorOptions = useMemo(
    () => ['Huawei', 'ZTE', 'Fiberhome', 'Nokia', 'Outro'],
    []
  );

  const handleInputChange =
    (field: keyof OLTFormData) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const payload = {
          name: formData.name.trim(),
          ip_address: formData.ip_address.trim(),
          vendor: formData.vendor.trim() || null,
          model: formData.model.trim() || null,
          snmp_community: formData.snmp_community.trim() || null,
          ssh_username: formData.ssh_username.trim() || null,
          ssh_password: formData.ssh_password.trim() || null,
          ssh_port: formData.ssh_port ? Number(formData.ssh_port) : null,
        };

        const created = await oltManagementApi.createOlt(payload);
        try {
          await oltManagerApi.getOltSnmpInfo(created.id);
          await oltManagementApi.updateOlt(created.id, {
            setup_status: 'configured',
            is_configured: true,
          });
        } catch (snmpError) {
          try {
            await oltManagementApi.deleteOlt(created.id);
          } catch (cleanupError) {
            console.warn('Falha ao remover OLT após erro de SNMP:', cleanupError);
          }
          throw snmpError;
        }

        setSuccess(`OLT ${created.name} adicionada com sucesso!`);

        setTimeout(() => {
          onSuccessNavigate?.();
        }, 2000);
      } catch (err) {
        setError('Falha ao conectar via SNMP. A OLT não foi salva.');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    },
    [formData, onSuccessNavigate]
  );

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <IconButton
            onClick={onCancel}
            sx={{ color: 'primary.main' }}
            disabled={!onCancel}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {success && (
          <AnimatedCard delay={200} sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Alert severity="success">{success}</Alert>
            </CardContent>
          </AnimatedCard>
        )}

        {error && (
          <AnimatedCard delay={200} sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </CardContent>
          </AnimatedCard>
        )}

        <AnimatedCard delay={300}>
          <CardContent sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    label="Nome da OLT"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    required
                    placeholder="Ex: OLT-COELHO-NETO"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    label="IP da OLT ou FQDN"
                    value={formData.ip_address}
                    onChange={handleInputChange('ip_address')}
                    required
                    placeholder="Ex: 172.17.19.25"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <LabeledSelect<string>
                    label="Fabricante"
                    value={formData.vendor}
                    onChange={handleInputChange('vendor')}
                  >
                    {vendorOptions.map((vendor) => (
                      <MenuItem key={vendor} value={vendor}>
                        {vendor}
                      </MenuItem>
                    ))}
                  </LabeledSelect>
                </Grid>

                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    label="Modelo da OLT"
                    value={formData.model}
                    onChange={handleInputChange('model')}
                    placeholder="Ex: MA5800-X15"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    label="SNMP Community (leitura)"
                    value={formData.snmp_community}
                    onChange={handleInputChange('snmp_community')}
                    helperText="Obrigatório para validar a conexão via SNMPv2c"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    label="Usuário SSH"
                    value={formData.ssh_username}
                    onChange={handleInputChange('ssh_username')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    label="Senha SSH"
                    type="password"
                    value={formData.ssh_password}
                    onChange={handleInputChange('ssh_password')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    label="Porta SSH"
                    value={formData.ssh_port}
                    onChange={handleInputChange('ssh_port')}
                    type="number"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FlexBox justifyContent="space-between">
                    <Button
                      variant="outlined"
                      onClick={onCancel}
                      disabled={loading || !onCancel}
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
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </AnimatedCard>
      </Container>
    </Box>
  );
};
