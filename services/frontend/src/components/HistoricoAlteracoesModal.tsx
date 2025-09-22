import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Stack,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Search,
  PersonOutline,
  CalendarToday,
  Edit,
  Visibility,
} from '@mui/icons-material';

interface HistoricoAlteracao {
  id: string;
  usuario: string;
  usuarioAvatar?: string;
  dataHora: string;
  acao: 'editado' | 'visualizado' | 'configurado';
  campo?: string;
  valorAnterior?: string;
  valorNovo?: string;
  descricao: string;
}

interface HistoricoAlteracoesModalProps {
  open: boolean;
  onClose: () => void;
  equipamentoId: string;
  equipamentoNome: string;
  historico: HistoricoAlteracao[];
}

const HistoricoAlteracoesModal: React.FC<HistoricoAlteracoesModalProps> = ({
  open,
  onClose,
  equipamentoId,
  equipamentoNome,
  historico,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar histórico baseado no termo de pesquisa
  const historicoFiltrado = historico.filter(
    (item) =>
      item.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.campo &&
        item.campo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case 'editado':
        return <Edit fontSize="small" />;
      case 'visualizado':
        return <Visibility fontSize="small" />;
      case 'configurado':
        return <Edit fontSize="small" />;
      default:
        return <Edit fontSize="small" />;
    }
  };

  const getAcaoColor = (acao: string) => {
    switch (acao) {
      case 'editado':
        return 'warning';
      case 'visualizado':
        return 'info';
      case 'configurado':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="600">
            Histórico de Alterações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Equipamento: <strong>{equipamentoNome}</strong> (ID: {equipamentoId}
            )
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Campo de Pesquisa */}
        <TextField
          fullWidth
          size="small"
          label="Pesquisar no histórico"
          placeholder="Usuário, ação, campo alterado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />

        {historicoFiltrado.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm
                ? `Nenhuma alteração encontrada para "${searchTerm}"`
                : 'Nenhuma alteração registrada para este equipamento'}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: '400px' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Data/Hora</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ação</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Detalhes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historicoFiltrado.map((item, index) => {
                  const { date, time } = formatDateTime(item.dataHora);
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={item.usuarioAvatar}
                            sx={{ width: 32, height: 32 }}
                          >
                            <PersonOutline />
                          </Avatar>
                          <Typography variant="body2" fontWeight="500">
                            {item.usuario}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight="500">
                            {date}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {time}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getAcaoIcon(item.acao)}
                          label={
                            item.acao.charAt(0).toUpperCase() +
                            item.acao.slice(1)
                          }
                          size="small"
                          color={getAcaoColor(item.acao) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {item.descricao}
                          </Typography>
                          {item.campo && (
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Campo: <strong>{item.campo}</strong>
                              </Typography>
                              {item.valorAnterior && item.valorNovo && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Chip
                                      label={item.valorAnterior}
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      sx={{ fontSize: '10px', height: 20 }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      →
                                    </Typography>
                                    <Chip
                                      label={item.valorNovo}
                                      size="small"
                                      variant="outlined"
                                      color="success"
                                      sx={{ fontSize: '10px', height: 20 }}
                                    />
                                  </Stack>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistoricoAlteracoesModal;
