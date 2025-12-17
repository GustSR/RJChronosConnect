import { Box, styled, Table, TableBody, TableCell, TableHead, TableRow, Chip, Skeleton, Alert } from '@mui/material';
import { H5 } from '@shared/ui/components/Typography';
import { FC } from 'react';
import ScrollBar from 'simplebar-react';
import { AnimatedCard } from '@shared/ui/components';
import { DeviceHub } from '@mui/icons-material';
import { useOltGridData } from '../model';

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
  const { oltData, loading, error } = useOltGridData();

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
    <AnimatedCard
      sx={{
        padding: '2rem',
        '&:hover': {
          transform: 'none',
          boxShadow:
            '0px 2px 1px -1px rgba(107, 114, 128, 0.03), 0px 1px 1px 0px rgba(107, 114, 128, 0.04), 0px 1px 3px 0px rgba(107, 114, 128, 0.08)',
        },
      }}
      delay={800}
    >
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
