import type { Dispatch, SetStateAction } from 'react';
import { Box, Button, CardContent, Grid, MenuItem, Stack, Typography } from '@mui/material';
import { ClickableCard, ConfigDialog, LabeledSelect, LabeledTextField, SectionCard } from '@shared/ui/components';

type Props = {
  selectedTest: string;
  setSelectedTest: Dispatch<SetStateAction<string>>;
};

export function TroubleshootingPanel({ selectedTest, setSelectedTest }: Props) {
  const handleClose = () => setSelectedTest('');

  const getDialogTitle = () => {
    switch (selectedTest) {
      case 'ip-ping':
        return 'IP PING - Teste de Conectividade';
      case 'download-test':
        return 'Download Test - Teste de Velocidade';
      case 'upload-test':
        return 'Upload Test - Teste de Velocidade';
      case 'trace-route':
        return 'Trace Route - Rastreamento de Rota';
      default:
        return 'Troubleshooting';
    }
  };

  const getPrimaryActionLabel = () => {
    switch (selectedTest) {
      case 'ip-ping':
        return 'Executar Teste PING';
      case 'download-test':
        return 'Iniciar Teste de Download';
      case 'upload-test':
        return 'Iniciar Teste de Upload';
      case 'trace-route':
        return 'Executar Trace Route';
      default:
        return 'Executar';
    }
  };

  const renderDialogContent = () => {
    if (selectedTest === 'ip-ping') {
      return (
        <SectionCard title="Configurações do Teste PING">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <LabeledTextField
                label="Endereço IP de Destino"
                placeholder="Ex: 8.8.8.8"
                defaultValue="8.8.8.8"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledTextField label="Número de Pacotes" type="number" defaultValue={4} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledTextField label="Tamanho do Pacote (bytes)" type="number" defaultValue={64} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledTextField label="Timeout (segundos)" type="number" defaultValue={5} />
            </Grid>
          </Grid>
        </SectionCard>
      );
    }

    if (selectedTest === 'download-test') {
      return (
        <SectionCard title="Teste de Velocidade de Download">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <LabeledSelect label="Servidor de Teste" defaultValue="auto">
                <MenuItem value="auto">Automático</MenuItem>
                <MenuItem value="speedtest.net">Speedtest.net</MenuItem>
                <MenuItem value="fast.com">Fast.com</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </LabeledSelect>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledTextField label="Duração do Teste (segundos)" type="number" defaultValue={30} />
            </Grid>
          </Grid>
        </SectionCard>
      );
    }

    if (selectedTest === 'upload-test') {
      return (
        <SectionCard title="Teste de Velocidade de Upload">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <LabeledSelect label="Servidor de Teste" defaultValue="auto">
                <MenuItem value="auto">Automático</MenuItem>
                <MenuItem value="speedtest.net">Speedtest.net</MenuItem>
                <MenuItem value="fast.com">Fast.com</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </LabeledSelect>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledTextField label="Duração do Teste (segundos)" type="number" defaultValue={30} />
            </Grid>
          </Grid>
        </SectionCard>
      );
    }

    if (selectedTest === 'trace-route') {
      return (
        <SectionCard title="Rastreamento de Rota de Rede">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <LabeledTextField
                label="Endereço de Destino"
                placeholder="Ex: google.com ou 8.8.8.8"
                defaultValue="google.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledTextField label="Máximo de Saltos" type="number" defaultValue={30} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledTextField label="Timeout por Salto (segundos)" type="number" defaultValue={5} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LabeledSelect label="Resolver Nomes" defaultValue="true">
                <MenuItem value="true">Sim</MenuItem>
                <MenuItem value="false">Não</MenuItem>
              </LabeledSelect>
            </Grid>
          </Grid>
        </SectionCard>
      );
    }

    return null;
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <ClickableCard
            sx={{ height: '140px', display: 'flex', flexDirection: 'column' }}
            onClick={() => setSelectedTest('ip-ping')}
          >
            <CardContent
              sx={{
                p: 2.5,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <Typography variant="h6" fontWeight="600" color="primary.main">
                IP PING
              </Typography>
            </CardContent>
          </ClickableCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ClickableCard
            sx={{ height: '140px', display: 'flex', flexDirection: 'column' }}
            onClick={() => setSelectedTest('download-test')}
          >
            <CardContent
              sx={{
                p: 2.5,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <Typography variant="h6" fontWeight="600" color="primary.main">
                Download Test
              </Typography>
            </CardContent>
          </ClickableCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ClickableCard
            sx={{ height: '140px', display: 'flex', flexDirection: 'column' }}
            onClick={() => setSelectedTest('upload-test')}
          >
            <CardContent
              sx={{
                p: 2.5,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <Typography variant="h6" fontWeight="600" color="primary.main">
                Upload Test
              </Typography>
            </CardContent>
          </ClickableCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ClickableCard
            sx={{ height: '140px', display: 'flex', flexDirection: 'column' }}
            onClick={() => setSelectedTest('trace-route')}
          >
            <CardContent
              sx={{
                p: 2.5,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <Typography variant="h6" fontWeight="600" color="primary.main">
                Trace Route
              </Typography>
            </CardContent>
          </ClickableCard>
        </Grid>
      </Grid>

      <ConfigDialog
        open={Boolean(selectedTest)}
        onClose={handleClose}
        closeButtonLabel="Fechar"
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight="600" sx={{ color: 'primary.main' }}>
              {getDialogTitle()}
            </Typography>
          </Stack>
        }
        actionsSx={{ px: 3, py: 2 }}
        actions={
          <>
            <Button variant="outlined" onClick={handleClose} sx={{ borderRadius: 2 }}>
              Fechar
            </Button>
            {selectedTest ? (
              <Button variant="contained" sx={{ borderRadius: 2, px: 4 }}>
                {getPrimaryActionLabel()}
              </Button>
            ) : null}
          </>
        }
      >
        {renderDialogContent()}
      </ConfigDialog>
    </Box>
  );
}
