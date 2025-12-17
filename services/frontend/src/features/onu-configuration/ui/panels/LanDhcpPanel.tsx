import type { Dispatch, SetStateAction } from 'react';
import { Save } from '@mui/icons-material';
import { Box, Button, Grid, MenuItem } from '@mui/material';
import { LabeledSelect, LabeledTextField } from '@shared/ui/components';
import type { LanDhcpConfig } from '../../types';

type Props = {
  config: LanDhcpConfig;
  setConfig: Dispatch<SetStateAction<LanDhcpConfig>>;
  hasChanges: boolean;
  onSave: () => void;
};

export function LanDhcpPanel({ config, setConfig, hasChanges, onSave }: Props) {
  return (
    <Box>
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
          <LabeledTextField
            label="LAN IP interface"
            value={config.lanIpInterface}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                lanIpInterface: e.target.value,
              }))
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledTextField
            label="LAN IP NETMASK"
            value={config.lanIpNetmask}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                lanIpNetmask: e.target.value,
              }))
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledSelect
            label="DHCP server Ativo"
            value={config.dhcpServerActive}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                dhcpServerActive: e.target.value,
              }))
            }
          >
            <MenuItem value="Sim">Sim</MenuItem>
            <MenuItem value="Não">Não</MenuItem>
          </LabeledSelect>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledTextField
            label="DHCP IP Pool Mínimo de endereços"
            value={config.dhcpIpPoolMin}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                dhcpIpPoolMin: e.target.value,
              }))
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledTextField
            label="DHCP IP Pool Máximo de endereços"
            value={config.dhcpIpPoolMax}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                dhcpIpPoolMax: e.target.value,
              }))
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledTextField
            label="DHCP Subnet máscara"
            value={config.dhcpSubnetMask}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                dhcpSubnetMask: e.target.value,
              }))
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledTextField
            label="DHCP Gateway padrão"
            value={config.dhcpGateway}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                dhcpGateway: e.target.value,
              }))
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledTextField
            label="DHCP DNS Servers"
            value={config.dhcpDnsServers}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                dhcpDnsServers: e.target.value,
              }))
            }
          />
        </Grid>
      </Grid>

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
