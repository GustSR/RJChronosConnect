import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CardContent,
  IconButton,
  Stack,
  Avatar,
  Chip,
  Alert,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Person,
  LocationOn,
  Phone,
  Email,
  Edit,
  Schedule,
} from '@mui/icons-material';
import { useTitle } from '@shared/lib/hooks';
import { AnimatedCard } from '@shared/ui/components';
import ONUInventoryCard from '@entities/onu/ui/ONUInventoryCard';
import AddOnuModal from '@features/onu-provisioning/ui/AddOnuModal';
import { useProvisioning } from '@features/onu-provisioning';

interface Cliente {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  documento: string;
  observacoes?: string;
  status: 'ativo' | 'inativo' | 'suspendido';
  dataCadastro: string;
}

interface ONUDoCliente {
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
}

const ClienteDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { provisionedONUs, pendingONUs } = useProvisioning();

  useTitle('Detalhes do Cliente - RJ Chronos');

  // Estados
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [onusDoCliente, setOnusDoCliente] = useState<ONUDoCliente[]>([]);
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [modalAddOnuOpen, setModalAddOnuOpen] = useState(false);

  // Estados para edição do cliente
  const [dadosEdicao, setDadosEdicao] = useState<Partial<Cliente>>({});

  useEffect(() => {
    const loadClienteData = async () => {
      setLoading(true);

      // Simular carregamento dos dados do cliente
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Encontrar a ONU provisionada correspondente
      const onuProvisionada = provisionedONUs.find((onu) => onu.id === id);

      if (onuProvisionada) {
        // Criar dados mock do cliente baseados na ONU
        const clienteMock: Cliente = {
          id: onuProvisionada.id,
          nome: onuProvisionada.clientName,
          endereco: onuProvisionada.clientAddress,
          telefone: '(21) 99999-9999',
          email: `${onuProvisionada.clientName
            .toLowerCase()
            .replace(/\s+/g, '.')}@email.com`,
          documento: '123.456.789-00',
          observacoes: 'Cliente residencial',
          status: 'ativo',
          dataCadastro: onuProvisionada.authorizedAt,
        };

        setCliente(clienteMock);
        setDadosEdicao(clienteMock);

        // Converter a ONU provisionada para o formato de ONU do cliente
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
          status: onuProvisionada.status,
          sinal: onuProvisionada.onuRx,
          dataAutorizacao: onuProvisionada.authorizedAt,
        };

        setOnusDoCliente([onuDoCliente]);
      }

      setLoading(false);
    };

    if (id) {
      loadClienteData();
    }
  }, [id, provisionedONUs]);

  const handleSalvarEdicao = () => {
    if (cliente && dadosEdicao) {
      setCliente({ ...cliente, ...dadosEdicao });
      setEditandoCliente(false);
    }
  };

  const handleCancelarEdicao = () => {
    if (cliente) {
      setDadosEdicao(cliente);
      setEditandoCliente(false);
    }
  };

  const handleProvisionONU = async (onuId: string) => {
    // Encontrar a ONU pendente
    const pendingONU = pendingONUs.find((onu) => onu.id === onuId);
    if (!pendingONU || !cliente) return;

    // Simular processo de provisionamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Criar nova ONU do cliente baseada na ONU pendente
    const novaOnuDoCliente: ONUDoCliente = {
      id: pendingONU.id,
      serialNumber: pendingONU.serialNumber,
      modelo: pendingONU.onuType,
      oltName: pendingONU.oltName,
      board: pendingONU.board.toString(),
      port: pendingONU.port.toString(),
      endereco: cliente.endereco,
      comentario: `ONU ${pendingONU.onuType} - Provisionada automaticamente`,
      vlan: '105', // VLAN padrão
      status: 'online',
      sinal: pendingONU.rxPower || -20,
      dataAutorizacao: new Date().toISOString(),
    };

    // Atualizar lista de ONUs do cliente
    setOnusDoCliente((prev) => [...prev, novaOnuDoCliente]);
  };

  const getStatusColor = (status: string) => {
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

  if (!cliente) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Cliente não encontrado.{' '}
          <Button onClick={() => navigate('/clientes')}>Voltar</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/clientes')}
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
            Detalhes do Cliente
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize e gerencie as informações e equipamentos do cliente
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setModalAddOnuOpen(true)}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1, #5855eb)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              },
            }}
          >
            Adicionar ONU/ONT
          </Button>
        </Stack>
      </Box>

      {/* Informações Básicas do Cliente */}
      <AnimatedCard delay={100} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                mr: 2,
                backgroundColor: 'primary.main',
                fontSize: '24px',
              }}
            >
              {cliente.nome.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="600" sx={{ mb: 1 }}>
                {cliente.nome}
              </Typography>
              <Chip
                label={cliente.status}
                color={
                  getStatusColor(cliente.status) as
                    | 'success'
                    | 'warning'
                    | 'error'
                }
                size="small"
                variant="filled"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <IconButton
              onClick={() => setEditandoCliente(!editandoCliente)}
              color="primary"
              size="small"
            >
              <Edit />
            </IconButton>
          </Box>

          <Divider sx={{ my: 3 }} />

          {editandoCliente ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={dadosEdicao.nome || ''}
                  onChange={(e) =>
                    setDadosEdicao({ ...dadosEdicao, nome: e.target.value })
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={dadosEdicao.telefone || ''}
                  onChange={(e) =>
                    setDadosEdicao({ ...dadosEdicao, telefone: e.target.value })
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="E-mail"
                  value={dadosEdicao.email || ''}
                  onChange={(e) =>
                    setDadosEdicao({ ...dadosEdicao, email: e.target.value })
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Documento"
                  value={dadosEdicao.documento || ''}
                  onChange={(e) =>
                    setDadosEdicao({
                      ...dadosEdicao,
                      documento: e.target.value,
                    })
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço"
                  value={dadosEdicao.endereco || ''}
                  onChange={(e) =>
                    setDadosEdicao({ ...dadosEdicao, endereco: e.target.value })
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={dadosEdicao.status || 'ativo'}
                    label="Status"
                    onChange={(e) =>
                      setDadosEdicao({
                        ...dadosEdicao,
                        status: e.target.value as
                          | 'ativo'
                          | 'inativo'
                          | 'suspenso',
                      })
                    }
                  >
                    <MenuItem value="ativo">Ativo</MenuItem>
                    <MenuItem value="suspenso">Suspenso</MenuItem>
                    <MenuItem value="inativo">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  value={dadosEdicao.observacoes || ''}
                  onChange={(e) =>
                    setDadosEdicao({
                      ...dadosEdicao,
                      observacoes: e.target.value,
                    })
                  }
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}
                >
                  <Button variant="outlined" onClick={handleCancelarEdicao}>
                    Cancelar
                  </Button>
                  <Button variant="contained" onClick={handleSalvarEdicao}>
                    Salvar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone
                      sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }}
                    />
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
                    <Email
                      sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }}
                    />
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
                    <Person
                      sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }}
                    />
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
                    <Schedule
                      sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Data de Cadastro
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
                    <LocationOn
                      sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Endereço
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="500">
                    {cliente.endereco}
                  </Typography>
                </Box>
              </Grid>

              {cliente.observacoes && (
                <Grid item xs={12}>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Observações
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {cliente.observacoes}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </AnimatedCard>

      {/* Inventário de ONUs/ONTs */}
      <AnimatedCard delay={200}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" fontWeight="600">
              Inventário de ONUs/ONTs
            </Typography>
            <Chip
              label={`${onusDoCliente.length} equipamento${
                onusDoCliente.length !== 1 ? 's' : ''
              }`}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>

          {onusDoCliente.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
              Nenhuma ONU/ONT encontrada para este cliente.
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setModalAddOnuOpen(true)}
                >
                  Adicionar Primeira ONU/ONT
                </Button>
              </Box>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {onusDoCliente.map((onu) => (
                <Grid item xs={12} md={6} lg={4} key={onu.id}>
                  <ONUInventoryCard
                    onu={onu}
                    onConfigure={() =>
                      navigate(`/clientes/${onu.id}/configurar`)
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </AnimatedCard>

      {/* Modal para Adicionar ONU */}
      {cliente && (
        <AddOnuModal
          open={modalAddOnuOpen}
          onClose={() => setModalAddOnuOpen(false)}
          clienteNome={cliente.nome}
          pendingONUs={pendingONUs}
          onProvisionONU={handleProvisionONU}
        />
      )}
    </Container>
  );
};

export default ClienteDetalhes;
