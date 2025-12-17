import { Box, CardContent, Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { OutlinedCard } from '@shared/ui/components';
import type { ConnectedHost } from '../../types';

type Props = {
  hosts: ConnectedHost[];
};

export function HostsPanel({ hosts }: Props) {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <OutlinedCard>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="600" color="primary.main">
                  {hosts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Dispositivos
                </Typography>
              </CardContent>
            </OutlinedCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <OutlinedCard>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="600" color="success.main">
                  {hosts.filter((host) => host.active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dispositivos Ativos
                </Typography>
              </CardContent>
            </OutlinedCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <OutlinedCard>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="600" color="error.main">
                  {hosts.filter((host) => !host.active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dispositivos Inativos
                </Typography>
              </CardContent>
            </OutlinedCard>
          </Grid>
        </Grid>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: 'none',
          transition: 'none !important',
          '&:hover': {
            boxShadow: 'none !important',
          },
          overflowX: 'hidden',
        }}
      >
        <Table
          size="small"
          sx={{
            tableLayout: 'fixed',
            width: '100%',
          }}
          aria-label="tabela de hosts conectados"
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'text.primary',
                  width: '50px',
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'text.primary',
                  width: '140px',
                }}
              >
                MAC Address
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'text.primary',
                  width: '120px',
                }}
              >
                IP Address
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'text.primary',
                  width: '100px',
                }}
              >
                Source
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'text.primary',
                  width: '140px',
                }}
              >
                Hostname
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'text.primary',
                  width: '80px',
                }}
              >
                Port
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'text.primary',
                  width: '80px',
                }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hosts.map((host) => (
              <TableRow
                key={host.id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                  transition: 'none !important',
                }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight="500">
                    {host.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {host.macAddress}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {host.ipAddress}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={host.addressSource}
                    size="small"
                    color={host.addressSource === 'DHCP' ? 'info' : 'warning'}
                    variant="outlined"
                    sx={{
                      fontSize: '11px',
                      transition: 'none !important',
                      '&:hover': { transform: 'none !important' },
                    }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="500"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {host.hostname}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={host.port}
                    size="small"
                    color={
                      host.port.includes('WiFi') ? 'primary' : 'secondary'
                    }
                    variant="outlined"
                    sx={{
                      fontSize: '10px',
                      height: '22px',
                      transition: 'none !important',
                      '&:hover': { transform: 'none !important' },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={host.active ? 'Ativo' : 'Inativo'}
                    size="small"
                    color={host.active ? 'success' : 'error'}
                    sx={{
                      fontSize: '10px',
                      height: '22px',
                      transition: 'none !important',
                      '&:hover': { transform: 'none !important' },
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
