import type { Dispatch, SetStateAction } from 'react';
import { Cancel, Save } from '@mui/icons-material';
import { Box, Button, CardContent, Grid, MenuItem, Stack, Typography } from '@mui/material';
import { ClickableCard, ConfigDialog, LabeledSelect, LabeledTextField, SectionCard } from '@shared/ui/components';
import type { SecurityConfig } from '../../types';
import { useState } from 'react';

type Props = {
  config: SecurityConfig;
  setConfig: Dispatch<SetStateAction<SecurityConfig>>;
  hasChanges: boolean;
  onSave: () => void;
};

export function SecurityPanel({ config, setConfig, hasChanges, onSave }: Props) {
  const [selectedSection, setSelectedSection] = useState<
    '' | 'service-access' | 'network-settings' | 'cli-credentials' | 'web-access'
  >('');

  const renderEnabledDisabledOptions = () => (
    <>
      <MenuItem value="Enabled">Enabled</MenuItem>
      <MenuItem value="Disabled">Disabled</MenuItem>
    </>
  );

  const updateField = (field: keyof SecurityConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => setSelectedSection('');

  const getSectionTitle = () => {
    switch (selectedSection) {
      case 'service-access':
        return 'Acessos de Serviços';
      case 'network-settings':
        return 'Configurações de Rede';
      case 'cli-credentials':
        return 'Credenciais CLI';
      case 'web-access':
        return 'Contas de Acesso Web';
      default:
        return 'Security';
    }
  };

  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'service-access':
        return (
          <SectionCard title="Acessos de Serviços">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="TP access from WAN"
                  value={config.tpAccessFromWan}
                  onChange={(e) => updateField('tpAccessFromWan', e.target.value)}
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="FTP access from LAN"
                  value={config.ftpAccessFromLan}
                  onChange={(e) => updateField('ftpAccessFromLan', e.target.value)}
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="User interface access from WAN"
                  value={config.userInterfaceAccessFromWan}
                  onChange={(e) =>
                    updateField('userInterfaceAccessFromWan', e.target.value)
                  }
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="User interface access from LAN"
                  value={config.userInterfaceAccessFromLan}
                  onChange={(e) =>
                    updateField('userInterfaceAccessFromLan', e.target.value)
                  }
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="SSH access from WAN"
                  value={config.sshAccessFromWan}
                  onChange={(e) => updateField('sshAccessFromWan', e.target.value)}
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="SSH access from LAN"
                  value={config.sshAccessFromLan}
                  onChange={(e) => updateField('sshAccessFromLan', e.target.value)}
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="Samba access from WAN"
                  value={config.sambaAccessFromWan}
                  onChange={(e) =>
                    updateField('sambaAccessFromWan', e.target.value)
                  }
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="Samba access from LAN"
                  value={config.sambaAccessFromLan}
                  onChange={(e) =>
                    updateField('sambaAccessFromLan', e.target.value)
                  }
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="Telnet access from WAN"
                  value={config.telnetAccessFromWan}
                  onChange={(e) =>
                    updateField('telnetAccessFromWan', e.target.value)
                  }
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="Telnet access from LAN"
                  value={config.telnetAccessFromLan}
                  onChange={(e) =>
                    updateField('telnetAccessFromLan', e.target.value)
                  }
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
            </Grid>
          </SectionCard>
        );
      case 'network-settings':
        return (
          <SectionCard title="Configurações de Rede">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="WAN ICMP Echo reply"
                  value={config.wanIcmpEchoReply}
                  onChange={(e) => updateField('wanIcmpEchoReply', e.target.value)}
                >
                  <MenuItem value="Block">Block</MenuItem>
                  <MenuItem value="Permit">Permit</MenuItem>
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="SSH Service"
                  value={config.sshService}
                  onChange={(e) => updateField('sshService', e.target.value)}
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledSelect
                  label="Telnet Service"
                  value={config.telnetService}
                  onChange={(e) => updateField('telnetService', e.target.value)}
                >
                  {renderEnabledDisabledOptions()}
                </LabeledSelect>
              </Grid>
            </Grid>
          </SectionCard>
        );
      case 'cli-credentials':
        return (
          <SectionCard title="Credenciais CLI">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LabeledTextField
                  label="CLI Username"
                  value={config.cliUsername}
                  onChange={(e) => updateField('cliUsername', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabeledTextField
                  label="CLI Password"
                  type="password"
                  value={config.cliPassword}
                  onChange={(e) => updateField('cliPassword', e.target.value)}
                />
              </Grid>
            </Grid>
          </SectionCard>
        );
      case 'web-access':
        return (
          <SectionCard title="Contas de Acesso Web">
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" fontWeight="600" sx={{ mb: 2, color: 'text.primary' }}>
                  Usuário Web
                </Typography>
                <Stack spacing={2}>
                  <LabeledSelect
                    label="Web user Account"
                    value={config.webUserAccount}
                    onChange={(e) => updateField('webUserAccount', e.target.value)}
                  >
                    {renderEnabledDisabledOptions()}
                  </LabeledSelect>
                  <LabeledTextField
                    label="Web user name"
                    value={config.webUserName}
                    onChange={(e) => updateField('webUserName', e.target.value)}
                  />
                  <LabeledTextField
                    label="Web user password"
                    type="password"
                    value={config.webUserPassword}
                    onChange={(e) => updateField('webUserPassword', e.target.value)}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1" fontWeight="600" sx={{ mb: 2, color: 'text.primary' }}>
                  Administrador Web
                </Typography>
                <Stack spacing={2}>
                  <LabeledSelect
                    label="Web admin account"
                    value={config.webAdminAccount}
                    onChange={(e) => updateField('webAdminAccount', e.target.value)}
                  >
                    {renderEnabledDisabledOptions()}
                  </LabeledSelect>
                  <LabeledTextField
                    label="Web admin name"
                    value={config.webAdminName}
                    onChange={(e) => updateField('webAdminName', e.target.value)}
                  />
                  <LabeledTextField
                    label="Web admin password"
                    type="password"
                    value={config.webAdminPassword}
                    onChange={(e) => updateField('webAdminPassword', e.target.value)}
                  />
                </Stack>
              </Grid>
            </Grid>
          </SectionCard>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <ClickableCard onClick={() => setSelectedSection('service-access')}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight="600" color="primary.main">
                  Acessos de Serviços
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SSH, Telnet, FTP, Samba e UI
                </Typography>
              </Stack>
            </CardContent>
          </ClickableCard>
        </Grid>

        <Grid item xs={12} sm={6}>
          <ClickableCard onClick={() => setSelectedSection('network-settings')}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight="600" color="primary.main">
                  Configurações de Rede
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ICMP, serviços e políticas
                </Typography>
              </Stack>
            </CardContent>
          </ClickableCard>
        </Grid>

        <Grid item xs={12} sm={6}>
          <ClickableCard onClick={() => setSelectedSection('cli-credentials')}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight="600" color="primary.main">
                  Credenciais CLI
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usuário e senha de console
                </Typography>
              </Stack>
            </CardContent>
          </ClickableCard>
        </Grid>

        <Grid item xs={12} sm={6}>
          <ClickableCard onClick={() => setSelectedSection('web-access')}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight="600" color="primary.main">
                  Contas de Acesso Web
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usuário e administrador
                </Typography>
              </Stack>
            </CardContent>
          </ClickableCard>
        </Grid>
      </Grid>

      <ConfigDialog
        open={Boolean(selectedSection)}
        onClose={handleClose}
        closeButtonLabel="Fechar"
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight="600" sx={{ color: 'primary.main' }}>
              {getSectionTitle()}
            </Typography>
          </Stack>
        }
        actionsSx={{ px: 3, py: 2 }}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleClose}
              sx={{ borderRadius: 2 }}
            >
              Fechar
            </Button>
            {hasChanges && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={onSave}
                sx={{ borderRadius: 2 }}
              >
                Salvar Alterações
              </Button>
            )}
          </>
        }
      >
        {renderSectionContent()}
      </ConfigDialog>

      {hasChanges && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={onSave}
            sx={{ borderRadius: 2 }}
          >
            Salvar Alterações
          </Button>
        </Box>
      )}
    </Box>
  );
}
