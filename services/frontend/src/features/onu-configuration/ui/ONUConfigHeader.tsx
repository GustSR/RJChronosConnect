import { RouterOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Grid, Link, Stack, Typography } from '@mui/material';

import type { ONUDetails } from '../types';

type Props = {
  onuDetails: ONUDetails;
  onOpenHistorico: () => void;
};

export function ONUConfigHeader({ onuDetails, onOpenHistorico }: Props) {
  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
        transition: 'none !important',
        '&:hover': {
          boxShadow: 'none !important',
          transform: 'none !important',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
              >
                <RouterOutlined
                  sx={{ mr: 1, color: 'primary.main', fontSize: 24 }}
                />
                Equipamento: {onuDetails.serialNumber}
              </Typography>
            </Box>

            <Stack spacing={1.5} sx={{ maxWidth: 300 }}>
              <Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="500"
                >
                  Pertence a: {onuDetails.customerName}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="500"
                >
                  OLT: {onuDetails.oltName}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="500"
                >
                  SLOT: {onuDetails.board}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="500"
                >
                  PON: {onuDetails.port}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="500"
                >
                  TR-069
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="500"
                >
                  SN: {onuDetails.serialNumber}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="500"
                >
                  Status: {onuDetails.status === 'online' ? 'Online' : 'Offline'}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '12px' }}
                >
                  Autorizado em:{' '}
                  {new Date(onuDetails.authorizedAt).toLocaleDateString(
                    'pt-BR'
                  )}{' '}
                  às{' '}
                  {new Date(onuDetails.authorizedAt).toLocaleTimeString(
                    'pt-BR'
                  )}
                </Typography>
              </Box>
              <Box>
                <Link
                  href="#"
                  color="primary"
                  underline="hover"
                  sx={{
                    fontWeight: 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenHistorico();
                  }}
                >
                  Histórico de alterações
                </Link>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  width: 150,
                  height: 100,
                  border: 2,
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  animation: 'rotate 4s linear infinite',
                  '@keyframes rotate': {
                    '0%': { transform: 'rotateY(0deg)' },
                    '100%': { transform: 'rotateY(360deg)' },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 25,
                    border: 1,
                    borderColor: 'text.disabled',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'common.black',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'info.main',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  >
                    0000
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
