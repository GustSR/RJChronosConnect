import type { Dispatch, SetStateAction } from 'react';
import { Cancel, Save } from '@mui/icons-material';
import { Box, Button, CardContent, Chip, Grid, MenuItem, Stack, Typography } from '@mui/material';
import { ClickableCard, ConfigDialog, LabeledSelect, LabeledTextField } from '@shared/ui/components';
import type { WifiNetworks } from '../../types';

type Props = {
  wifiNetworks: WifiNetworks;
  selectedWifiLan: string;
  setSelectedWifiLan: Dispatch<SetStateAction<string>>;
  updateWifiNetwork: (networkKey: string, field: string, value: any) => void;
  hasWifiChanges: (networkKey: string) => boolean;
  onSaveWifi: (networkKey: string) => void;
};

export function WifiPanel({
  wifiNetworks,
  selectedWifiLan,
  setSelectedWifiLan,
  updateWifiNetwork,
  hasWifiChanges,
  onSaveWifi,
}: Props) {
  return (
    <Box>
      <Grid container spacing={2}>
        {Object.entries(wifiNetworks).map(([key, network]) => (
          <Grid item xs={12} sm={6} key={key}>
            <ClickableCard onClick={() => setSelectedWifiLan(key)}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      color="primary.main"
                    >
                      {network.name}
                    </Typography>
                    <Chip
                      label={network.band}
                      size="small"
                      color={network.band === '5G' ? 'success' : 'info'}
                      variant="outlined"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      SSID: <strong>{network.ssid}</strong>
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Chip
                      label={network.status}
                      size="small"
                      color={network.status === 'Ativo' ? 'success' : 'default'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {network.totalAssociations} dispositivos
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </ClickableCard>
          </Grid>
        ))}
      </Grid>

      <ConfigDialog
        open={Boolean(selectedWifiLan)}
        onClose={() => setSelectedWifiLan('')}
        closeButtonLabel="Fechar"
        title={(() => {
          const network = wifiNetworks[selectedWifiLan as keyof typeof wifiNetworks];
          if (!network) return null;

          return (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" fontWeight="600" sx={{ color: 'primary.main' }}>
                {network.name}
              </Typography>
              <Chip
                label={network.band}
                size="small"
                color={network.band === '5G' ? 'success' : 'info'}
                variant="outlined"
              />
            </Stack>
          );
        })()}
        actionsSx={{ px: 3, py: 2 }}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => setSelectedWifiLan('')}
              sx={{ borderRadius: 2 }}
            >
              Fechar
            </Button>
            {selectedWifiLan && hasWifiChanges(selectedWifiLan) && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => onSaveWifi(selectedWifiLan)}
                sx={{ borderRadius: 2 }}
              >
                Salvar Alterações
              </Button>
            )}
          </>
        }
      >
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
            {(() => {
              const network =
                wifiNetworks[selectedWifiLan as keyof typeof wifiNetworks];
              if (!network) return null;

              return (
                <>
                  <Grid item xs={12} sm={6}>
                    <LabeledTextField
                      label="SSID"
                      value={network.ssid}
                      onChange={(e) =>
                        updateWifiNetwork(selectedWifiLan, 'ssid', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledTextField
                      label="Password"
                      type="password"
                      value={network.password}
                      onChange={(e) =>
                        updateWifiNetwork(selectedWifiLan, 'password', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Authentication mode"
                      value={network.authMode}
                      onChange={(e) =>
                        updateWifiNetwork(selectedWifiLan, 'authMode', e.target.value)
                      }
                    >
                      <MenuItem value="Open">Open</MenuItem>
                      <MenuItem value="WEP">WEP</MenuItem>
                      <MenuItem value="WPA-PSK">WPA-PSK</MenuItem>
                      <MenuItem value="WPA2-PSK">WPA2-PSK</MenuItem>
                      <MenuItem value="WPA3-PSK">WPA3-PSK</MenuItem>
                      <MenuItem value="WPA/WPA2-PSK">WPA/WPA2-PSK</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Status"
                      value={network.status}
                      onChange={(e) =>
                        updateWifiNetwork(selectedWifiLan, 'status', e.target.value)
                      }
                    >
                      <MenuItem value="Ativo">Ativo</MenuItem>
                      <MenuItem value="Inativo">Inativo</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Enable"
                      value={network.enabled ? 'Sim' : 'Não'}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'enabled',
                          e.target.value === 'Sim'
                        )
                      }
                    >
                      <MenuItem value="Sim">Sim</MenuItem>
                      <MenuItem value="Não">Não</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledTextField label="Frequency Band" value={network.rfBand} disabled />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Standard"
                      value={network.standard}
                      onChange={(e) =>
                        updateWifiNetwork(selectedWifiLan, 'standard', e.target.value)
                      }
                    >
                      <MenuItem value="802.11b">802.11b</MenuItem>
                      <MenuItem value="802.11g">802.11g</MenuItem>
                      <MenuItem value="802.11n">802.11n</MenuItem>
                      <MenuItem value="802.11ac">802.11ac</MenuItem>
                      <MenuItem value="802.11ax">802.11ax</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Radio Enable"
                      value={network.radioEnabled ? 'Sim' : 'Não'}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'radioEnabled',
                          e.target.value === 'Sim'
                        )
                      }
                    >
                      <MenuItem value="Sim">Sim</MenuItem>
                      <MenuItem value="Não">Não</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledTextField
                      label="Total Associations"
                      value={network.totalAssociations}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="SSID Advertisement Enable"
                      value={network.ssidAdvertisement ? 'Sim' : 'Não'}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'ssidAdvertisement',
                          e.target.value === 'Sim'
                        )
                      }
                    >
                      <MenuItem value="Sim">Sim</MenuItem>
                      <MenuItem value="Não">Não</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="WPA Encryption"
                      value={network.wpaEncryption}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'wpaEncryption',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="AES">AES</MenuItem>
                      <MenuItem value="TKIP">TKIP</MenuItem>
                      <MenuItem value="AES/TKIP">AES/TKIP</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Channel Width"
                      value={network.channelWidth}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'channelWidth',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="20MHz">20MHz</MenuItem>
                      <MenuItem value="40MHz">40MHz</MenuItem>
                      <MenuItem value="80MHz">80MHz</MenuItem>
                      <MenuItem value="160MHz">160MHz</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Auto Channel Enable"
                      value={network.autoChannel ? 'Sim' : 'Não'}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'autoChannel',
                          e.target.value === 'Sim'
                        )
                      }
                    >
                      <MenuItem value="Sim">Sim</MenuItem>
                      <MenuItem value="Não">Não</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledTextField
                      label="Channel"
                      type="number"
                      value={network.channel}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'channel',
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Country Regulatory Domain"
                      value={network.countryDomain}
                      onChange={(e) =>
                        updateWifiNetwork(
                          selectedWifiLan,
                          'countryDomain',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="BR">BR - Brasil</MenuItem>
                      <MenuItem value="US">US - Estados Unidos</MenuItem>
                      <MenuItem value="EU">EU - Europa</MenuItem>
                      <MenuItem value="JP">JP - Japão</MenuItem>
                    </LabeledSelect>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabeledSelect
                      label="Tx Power"
                      value={network.txPower}
                      onChange={(e) =>
                        updateWifiNetwork(selectedWifiLan, 'txPower', e.target.value)
                      }
                    >
                      <MenuItem value="25%">25%</MenuItem>
                      <MenuItem value="50%">50%</MenuItem>
                      <MenuItem value="75%">75%</MenuItem>
                      <MenuItem value="100%">100%</MenuItem>
                    </LabeledSelect>
                  </Grid>
                </>
              );
            })()}
          </Grid>
      </ConfigDialog>
    </Box>
  );
}
