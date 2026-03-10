import type { ConfigurationTabId } from '@features/onu-configuration';
import {
  ONUConfigHeader,
  ONUConfigMenu,
  ONUConfigContent,
  HistoricoAlteracoesModal,
  historicoAlteracoes,
} from '@features/onu-configuration';
import { useONUDetails } from '@features/onu-configuration/hooks';
import { ArrowBack } from '@mui/icons-material';
import { Box, Container, Grid, IconButton, Typography } from '@mui/material';
import { useTitle } from '@shared/lib/hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ONUConfiguration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useTitle('Configuração ONU');

  const { onuDetails, loading } = useONUDetails(id);
  const [selectedMenuItem, setSelectedMenuItem] = useState<ConfigurationTabId | ''>('');
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            Carregando...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!onuDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            ONU não encontrada
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/clientes')}
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ONUConfigHeader
            onuDetails={onuDetails}
            onOpenHistorico={() => setHistoricoModalOpen(true)}
          />
        </Grid>

        <Grid item xs={12} lg={6}>
          <ONUConfigMenu
            selectedItem={selectedMenuItem}
            onSelect={setSelectedMenuItem}
          />
        </Grid>

        {selectedMenuItem && (
          <Grid item xs={12} lg={6}>
            <ONUConfigContent
              selectedItem={selectedMenuItem}
              onuDetails={onuDetails}
            />
          </Grid>
        )}
      </Grid>

      <HistoricoAlteracoesModal
        open={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        equipamentoId={onuDetails.id}
        equipamentoNome={onuDetails.serialNumber}
        historico={historicoAlteracoes}
      />
    </Container>
  );
}
