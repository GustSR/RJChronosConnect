import React, { useEffect, useState } from 'react';
import { Add, ArrowBack, Edit, Email, LocationOn, Person, Phone, Schedule } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Container, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography } from '@mui/material';
import { AnimatedCard } from '@shared/ui/components';
import ONUInventoryCard from '@entities/onu/ui/ONUInventoryCard';
import AddOnuModal from '@features/onu-provisioning/ui/AddOnuModal';
import type { PendingONU, ProvisionedONU } from '@features/onu-provisioning/provisioning';

type ClienteStatus = 'ativo' | 'inativo' | 'suspenso';

type Cliente = {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  documento: string;
  observacoes?: string;
  status: ClienteStatus;
  dataCadastro: string;
};

type ONUDoCliente = {
  id: string;
  serialNumber: string;
  modelo: string;
  oltName: string;
  board: string;
  port: string;
  endereco: string;
  comentario?: string;
  vlan: string;
  status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
  sinal: number;
  dataAutorizacao: string;
};

type Props = {
  customerId?: string;
  provisionedONUs: ProvisionedONU[];
  pendingONUs: PendingONU[];
  onBack: () => void;
  onConfigureOnu: (onuId: string) => void;
};

export const CustomerDetailsPage: React.FC<Props> = ({
  customerId,
  provisionedONUs,
  pendingONUs,
  onBack,
  onConfigureOnu,
}) => {
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [onusDoCliente, setOnusDoCliente] = useState<ONUDoCliente[]>([]);
  const [modalAddOnuOpen, setModalAddOnuOpen] = useState(false);
  const [modalEditClienteOpen, setModalEditClienteOpen] = useState(false);
  const [dadosEdicao, setDadosEdicao] = useState<Partial<Cliente>>({});

  useEffect(() => {
    const loadClienteData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const onuProvisionada = provisionedONUs.find((onu) => onu.id === customerId);

      if (onuProvisionada) {
        const clienteMock: Cliente = {
          id: onuProvisionada.id,
          nome: onuProvisionada.clientName,
          endereco: onuProvisionada.clientAddress,
          telefone: '(21) 99999-9999',
          email: `${onuProvisionada.clientName.toLowerCase().replace(/\\s+/g, '.')}@email.com`,
          documento: '123.456.789-00',
          observacoes: 'Cliente residencial',
          status: 'ativo',
          dataCadastro: onuProvisionada.authorizedAt,
        };

        setCliente(clienteMock);
        setDadosEdicao(clienteMock);

        const onuDoCliente: ONUDoCliente = {
          id: onuProvisionada.id,
          serialNumber: onuProvisionada.serialNumber,
          modelo: onuProvisionada.onuType,
          oltName: onuProvisionada.oltName,
          board: onuProvisionada.board.toString(),
          port: onuProvisionada.port.toString(),
          endereco: onuProvisionada.clientAddress,
          comentario: `ONU ${onuProvisionada.onuType} - Modo ${onuProvisionada.onuMode}`,
          vlan: onuProvisionada.attachedVlans.join(','),
          status: onuProvisionada.status === 'disabled' ? 'admin_disabled' : onuProvisionada.status,
          sinal: onuProvisionada.onuRx,
          dataAutorizacao: onuProvisionada.authorizedAt,
        };

        setOnusDoCliente([onuDoCliente]);
      } else {
        setCliente(null);
        setOnusDoCliente([]);
      }

      setLoading(false);
    };

    if (customerId) {
      loadClienteData();
    } else {
      setLoading(false);
      setCliente(null);
      setOnusDoCliente([]);
    }
  }, [customerId, provisionedONUs]);

  const handleOpenEditModal = () => {
    if (!cliente) return;
    setDadosEdicao(cliente);
    setModalEditClienteOpen(true);
  };

  const handleSalvarEdicao = () => {
    if (!cliente) return;
    setCliente({ ...cliente, ...dadosEdicao } as Cliente);
    setModalEditClienteOpen(false);
  };

  const handleCancelarEdicao = () => {
    if (cliente) setDadosEdicao(cliente);
    setModalEditClienteOpen(false);
  };

  const handleProvisionONU = async (onuId: string) => {
    const pendingONU = pendingONUs.find((onu) => onu.id === onuId);
    if (!pendingONU || !cliente) return;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const novaOnuDoCliente: ONUDoCliente = {
      id: pendingONU.id,
      serialNumber: pendingONU.serialNumber,
      modelo: pendingONU.onuType,
      oltName: pendingONU.oltName,
      board: pendingONU.board.toString(),
      port: pendingONU.port.toString(),
      endereco: cliente.endereco,
      comentario: `ONU ${pendingONU.onuType} - Provisionada automaticamente`,
      vlan: '105',
      status: 'online',
      sinal: pendingONU.rxPower || -20,
      dataAutorizacao: new Date().toISOString(),
    };

    setOnusDoCliente((prev) => [...prev, novaOnuDoCliente]);
  };

  const getStatusColor = (status: ClienteStatus) => {
    switch (status) {
      case 'ativo':
        return 'success';
      case 'suspenso':
        return 'warning';
      case 'inativo':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            Carregando...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!cliente) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Cliente não encontrado. <Button onClick={onBack}>Voltar</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={onBack} sx={{ mr: 2, color: 'primary.main' }}>
          <ArrowBack />
        </IconButton>
      </Box>

      <AnimatedCard delay={100} disableHoverEffect={true} sx={{ mb: 4, boxShadow: 'none !important', border: '1px solid #f0f0f0' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 60, height: 60, mr: 2, backgroundColor: 'primary.main', fontSize: '24px' }}>
              {cliente.nome.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="600" sx={{ mb: 1 }}>
                {cliente.nome}
              </Typography>
              <Chip label={cliente.status} color={getStatusColor(cliente.status) as 'success' | 'warning' | 'error'} size="small" variant="filled" sx={{ textTransform: 'capitalize' }} />
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setModalAddOnuOpen(true)}
                size="small"
                sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #5855eb)', '&:hover': { background: 'linear-gradient(135deg, #5855eb, #4f46e5)' } }}
              >
                Adicionar ONU/ONT
              </Button>
              <IconButton onClick={handleOpenEditModal} color="primary" size="small">
                <Edit />
              </IconButton>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Telefone
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="500">
                  {cliente.telefone}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    E-mail
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="500">
                  {cliente.email}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Documento
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="500">
                  {cliente.documento}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Cadastrado em
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="500">
                  {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Endereço
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="500">
                  {cliente.endereco}
                </Typography>
              </Box>
            </Grid>

            {cliente.observacoes ? (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Observações
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {cliente.observacoes}
                  </Typography>
                </Box>
              </Grid>
            ) : null}
          </Grid>
        </CardContent>
      </AnimatedCard>

      {onusDoCliente.length === 0 ? (
        <Alert severity="info" sx={{ textAlign: 'center', py: 4, mb: 4 }}>
          Nenhuma ONU/ONT encontrada para este cliente.
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {onusDoCliente.map((onu) => (
            <Grid item xs={12} md={6} lg={4} key={onu.id}>
              <ONUInventoryCard onu={onu} onConfigure={() => onConfigureOnu(onu.id)} />
            </Grid>
          ))}
        </Grid>
      )}

      <AddOnuModal open={modalAddOnuOpen} onClose={() => setModalAddOnuOpen(false)} clienteNome={cliente.nome} pendingONUs={pendingONUs} onProvisionONU={handleProvisionONU} />

      <Modal
        open={modalEditClienteOpen}
        onClose={handleCancelarEdicao}
        slotProps={{ backdrop: { sx: { transition: 'none !important' } } }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', '& .MuiModal-root': { transition: 'none !important' } }}
      >
        <Card sx={{ minWidth: 500, maxWidth: 800, p: 4, outline: 'none', borderRadius: 2, backgroundColor: 'white', transition: 'none !important', transform: 'none !important' }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Editar Cliente
          </Typography>

          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <TextField label="Nome" value={dadosEdicao.nome || ''} onChange={(e) => setDadosEdicao({ ...dadosEdicao, nome: e.target.value })} fullWidth size="small" required />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField label="Telefone" value={dadosEdicao.telefone || ''} onChange={(e) => setDadosEdicao({ ...dadosEdicao, telefone: e.target.value })} fullWidth size="small" type="tel" required />
              <TextField label="E-mail" value={dadosEdicao.email || ''} onChange={(e) => setDadosEdicao({ ...dadosEdicao, email: e.target.value })} fullWidth size="small" type="email" required />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField label="Documento" value={dadosEdicao.documento || ''} onChange={(e) => setDadosEdicao({ ...dadosEdicao, documento: e.target.value })} fullWidth size="small" required />
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={dadosEdicao.status || 'ativo'} label="Status" onChange={(e) => setDadosEdicao({ ...dadosEdicao, status: e.target.value as ClienteStatus })} MenuProps={{ disableScrollLock: true }}>
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="suspenso">Suspenso</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField label="Endereço" value={dadosEdicao.endereco || ''} onChange={(e) => setDadosEdicao({ ...dadosEdicao, endereco: e.target.value })} fullWidth size="small" required />

            <TextField label="Observações" value={dadosEdicao.observacoes || ''} onChange={(e) => setDadosEdicao({ ...dadosEdicao, observacoes: e.target.value })} fullWidth size="small" multiline rows={3} />

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="contained" onClick={handleSalvarEdicao} sx={{ flex: 1 }}>
                Salvar
              </Button>
              <Button variant="outlined" onClick={handleCancelarEdicao} sx={{ flex: 1 }}>
                Cancelar
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Modal>
    </Container>
  );
};

