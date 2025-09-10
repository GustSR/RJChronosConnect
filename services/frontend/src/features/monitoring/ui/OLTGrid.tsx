import {
  Box,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import { H5 } from '@shared/ui/components/Typography';
import { FC, useEffect, useState } from 'react';
import ScrollBar from 'simplebar-react';
import { AnimatedCard } from '@shared/ui/components';
import { DeviceHub } from '@mui/icons-material';
import { genieacsApi } from '@shared/api/genieacsApi';
import { OLT } from '@shared/api/types';

const commonCSS = {
  minWidth: 120,
  '&:nth-of-type(2)': { minWidth: 170 },
  '&:nth-of-type(3)': { minWidth: 80 },
};

// Styled components
const HeadTableCell = styled(TableCell)(() => ({
  fontSize: 12,
  fontWeight: 600,
  '&:first-of-type': { paddingLeft: 0 },
  '&:last-of-type': { paddingRight: 0 },
}));

const BodyTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: 12,
  fontWeight: 500,
  padding: 0,
  paddingLeft: '1rem',
  paddingTop: '0.7rem',
  '&:first-of-type': { paddingLeft: 0 },
  '&:last-of-type': { paddingRight: 0 },
  [theme.breakpoints.down('sm')]: { ...commonCSS },
  [theme.breakpoints.between(960, 1270)]: { ...commonCSS },
}));

// Interface para dados da grid de OLTs
interface OLTGridData {
  id: string;
  oltName: string;
  totalOnts: number;
  onlineOnts: number;
  offlineOnts: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
  lastIssue: string;
  uptime: string;
  model: string;
  location: string;
}

const formatUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};

const getOLTStatus = (
  olt: OLT,
  onlineCount: number,
  totalCount: number
): 'online' | 'offline' | 'warning' | 'critical' => {
  if (olt.status === 'offline') return 'offline';

  const onlinePercentage =
    totalCount > 0 ? (onlineCount / totalCount) * 100 : 0;

  if (onlinePercentage < 70) return 'critical';
  if (onlinePercentage < 90) return 'warning';
  return 'online';
};

const getLastIssue = (status: string): string => {
  switch (status) {
    case 'offline':
      return 'OLT desconectada';
    case 'critical':
      return 'Muitas ONUs offline';
    case 'warning':
      return 'Algumas ONUs com problema';
    case 'online':
      return 'Nenhum problema';
    default:
      return 'Status desconhecido';
  }
};

const getStatusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'online':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
    case 'offline':
      return 'error';
    default:
      return 'default';
  }
};

const OLTGrid: FC = () => {
  const [oltData, setOltData] = useState<OLTGridData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOLTData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar OLTs
      const olts = await genieacsApi.getOLTs();

      // Para cada OLT, buscar estatísticas das ONUs
      const oltGridData: OLTGridData[] = await Promise.all(
        olts.map(async (olt) => {
          try {
            const stats = await genieacsApi.getOLTStats(olt.id);
            const status = getOLTStatus(olt, stats.online, stats.total);

            return {
              id: olt.id,
              oltName: `OLT-${olt.location
                .split(' - ')[0]
                .toUpperCase()}-${olt.id.padStart(2, '0')}`,
              totalOnts: stats.total,
              onlineOnts: stats.online,
              offlineOnts: stats.offline,
              status,
              lastIssue: getLastIssue(status),
              uptime: formatUptime(olt.uptime || 0),
              model: olt.model,
              location: olt.location,
            };
          } catch (statError) {
            console.error(`Erro ao buscar stats da OLT ${olt.id}:`, statError);
            return {
              id: olt.id,
              oltName: `OLT-${olt.location
                .split(' - ')[0]
                .toUpperCase()}-${olt.id.padStart(2, '0')}`,
              totalOnts: 0,
              onlineOnts: 0,
              offlineOnts: 0,
              status: 'offline' as const,
              lastIssue: 'Erro ao carregar dados',
              uptime: '0d 0h',
              model: olt.model,
              location: olt.location,
            };
          }
        })
      );

      setOltData(oltGridData);
    } catch (error) {
      console.error('Erro ao carregar dados das OLTs:', error);
      setError('Erro ao carregar dados das OLTs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOLTData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={800}>
        <H5>Status das OLTs</H5>
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3, 4].map((index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Skeleton variant="text" width="20%" height={40} />
              <Skeleton variant="text" width="15%" height={40} />
              <Skeleton variant="text" width="15%" height={40} />
              <Skeleton variant="text" width="15%" height={40} />
              <Skeleton variant="rectangular" width="10%" height={32} />
              <Skeleton variant="text" width="20%" height={40} />
              <Skeleton variant="text" width="10%" height={40} />
            </Box>
          ))}
        </Box>
      </AnimatedCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={800}>
        <H5>Status das OLTs</H5>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error} - Dados em cache não disponíveis
        </Alert>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard sx={{ padding: '2rem' }} delay={800}>
      <H5>Status das OLTs</H5>

      <ScrollBar>
        <Table>
          <TableHead
            sx={{ borderBottom: '1.5px solid', borderColor: 'divider' }}
          >
            <TableRow>
              <HeadTableCell>OLT</HeadTableCell>
              <HeadTableCell align="center">Total ONTs</HeadTableCell>
              <HeadTableCell align="center">Online</HeadTableCell>
              <HeadTableCell align="center">Offline</HeadTableCell>
              <HeadTableCell align="center">Status</HeadTableCell>
              <HeadTableCell>Último Problema</HeadTableCell>
              <HeadTableCell align="center">Uptime</HeadTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {oltData.map((olt) => (
              <TableRow key={olt.id}>
                <BodyTableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DeviceHub
                      sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }}
                    />
                    {olt.oltName}
                  </Box>
                </BodyTableCell>
                <BodyTableCell align="center">{olt.totalOnts}</BodyTableCell>
                <BodyTableCell align="center">
                  <Box sx={{ color: 'success.main', fontWeight: 600 }}>
                    {olt.onlineOnts}
                  </Box>
                </BodyTableCell>
                <BodyTableCell align="center">
                  <Box sx={{ color: 'error.main', fontWeight: 600 }}>
                    {olt.offlineOnts}
                  </Box>
                </BodyTableCell>
                <BodyTableCell align="center">
                  <Chip
                    label={olt.status.toUpperCase()}
                    color={getStatusColor(olt.status)}
                    size="small"
                    sx={{ fontSize: 10 }}
                  />
                </BodyTableCell>
                <BodyTableCell>{olt.lastIssue}</BodyTableCell>
                <BodyTableCell align="center">{olt.uptime}</BodyTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollBar>
    </AnimatedCard>
  );
};

export default OLTGrid;
