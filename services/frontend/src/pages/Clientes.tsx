import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Grid,
  Stack,
  Avatar,
  Typography,
  IconButton,
  Modal,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FormatListBulleted as FormatListIcon,
  Apps as AppsIcon,
  ArrowDownward as ArrowDownwardIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// UKO Components
import FlexBox from '@shared/ui/components/FlexBox';
import SearchInput from '@shared/ui/components/SearchInput';

// Hooks e componentes
import { useTitle } from '@shared/lib/hooks';
import {
  useMuiTable,
  stableSort,
  getComparator,
} from '@shared/lib/hooks/useMuiTable';
import { CustomerCard } from '@features/customer/ui/CustomerCard';

// Types e dados
import { Customer } from '@entities/customer/model/customerTypes';
import { useProvisioning } from '@features/onu-provisioning';
import { ProvisionedONU } from '@features/onu-provisioning/provisioning';

// Styled components
const StyledFlexBox = styled(FlexBox)(({ theme }) => ({
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 20,
  [theme.breakpoints.down(500)]: {
    width: '100%',
    '& .MuiInputBase-root': { maxWidth: '100%' },
    '& .MuiButton-root': {
      width: '100%',
      marginTop: 15,
    },
  },
}));

const ViewToggleContainer = styled(Box)(() => ({
  display: 'flex',
  gap: 4,
  backgroundColor: 'rgb(246, 247, 248)',
  borderRadius: '8px',
  padding: '4px',
}));

const Clientes: React.FC = () => {
  useTitle('Clientes - RJ Chronos');
  const navigate = useNavigate();

  const {
    provisionedONUs,
    refreshProvisionedONUs,
    loading: contextLoading,
  } = useProvisioning();

  // Estados
  const [searchValue, setSearchValue] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >();
  const [currentView, setCurrentView] = useState<'list' | 'grid'>('list');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    avatar: '/static/avatar/001-man.svg',
  });

  // Estados para controle da tabela/paginação
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof Customer>('name');

  // Handlers para ordenação e paginação
  const handleRequestSort = useCallback(
    (event: React.MouseEvent<unknown>, property: keyof Customer) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [order, orderBy]
  );

  const handleChangePage = useCallback(
    (event: React.ChangeEvent<unknown>, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      setRowsPerPage(parseInt(event.target.value as string, 10));
      setPage(1);
    },
    []
  );

  // Converter ONUs provisionadas para formato Customer (UKO-style)
  const convertProvisionedToCustomer = useCallback(
    (onu: ProvisionedONU): Customer => {
      let status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
      if (onu.status === 'disabled') {
        status = 'admin_disabled';
      } else {
        status = onu.status;
      }

      return {
        id: onu.id,
        name: onu.clientName,
        position: 'Subscriber',
        company: 'Telecom',
        email: `${onu.clientName
          .toLowerCase()
          .replace(/\\s+/g, '.')}@example.com`,
        phone: '(21) 9999-9999',
        cpfCnpj: Math.random() > 0.5 ? '123.456.789-00' : '12.345.678/0001-90',
        avatar: (() => {
          const avatars = [
            '001-man.svg',
            '002-girl.svg',
            '003-boy.svg',
            '004-woman.svg',
            '005-man-1.svg',
            '006-woman-1.svg',
            '007-boy-1.svg',
            '008-clown.svg',
            '009-firefighter.svg',
            '010-girl-1.svg',
            '011-man-2.svg',
            '012-woman-2.svg',
            '013-woman-3.svg',
            '014-man-3.svg',
            '015-woman-4.svg',
            '016-boy-2.svg',
            '017-girl-2.svg',
            '018-boy-3.svg',
            '019-woman-5.svg',
            '020-man-4.svg',
            '021-girl-3.svg',
            '022-man-5.svg',
            '023-man-6.svg',
            '024-woman-6.svg',
            '025-boy-4.svg',
            '026-girl-4.svg',
            '027-man-7.svg',
            '028-woman-7.svg',
            '029-man-8.svg',
            '030-policewoman.svg',
            '031-policeman.svg',
            '032-girl-5.svg',
            '033-superhero.svg',
            '034-woman-8.svg',
            '035-woman-9.svg',
            '036-man-9.svg',
            '037-arab-woman.svg',
            '038-man-10.svg',
            '039-woman-10.svg',
            '040-man-11.svg',
            '041-woman-11.svg',
            '042-vampire.svg',
            '043-chef.svg',
            '044-farmer.svg',
            '045-man-12.svg',
            '046-woman-12.svg',
            '047-man-13.svg',
            '048-boy-5.svg',
            '049-thief.svg',
            '050-catwoman.svg',
            '051-american-football-player.svg',
            '052-witch.svg',
            '053-concierge.svg',
            '054-woman-13.svg',
            '055-bodybuilder.svg',
            '056-girl-6.svg',
            '057-woman-14.svg',
            '058-death.svg',
            '059-doctor.svg',
            '060-doctor-1.svg',
            '061-nun.svg',
            '062-builder.svg',
            '063-girl-7.svg',
            '064-punk.svg',
            '065-pinup.svg',
            '066-boy-6.svg',
            '067-man-14.svg',
            '068-girl-8.svg',
            '069-woman-15.svg',
            '070-man-15.svg',
          ];
          return `/static/avatar/${
            avatars[Math.floor(Math.random() * avatars.length)]
          }`;
        })(),

        // Campos específicos do RJChronos
        status,
        serialNumber: onu.serialNumber,
        oltName: onu.oltName,
        board: `${onu.board}/${onu.port}`,
        port: onu.port.toString(),
        sinal: onu.onuRx,
        modo: onu.onuMode,
        vlan: onu.attachedVlans.join(','),
        voip: onu.voipEnabled || false,
        dataAutenticacao: onu.authorizedAt,
        tipoOnu: onu.onuType,
        endereco: onu.clientAddress,
        rxPower: onu.onuRx,
      };
    },
    []
  );

  // Memoizar clientes
  const customers = useMemo(
    () => provisionedONUs.map(convertProvisionedToCustomer),
    [provisionedONUs, convertProvisionedToCustomer]
  );

  // Filtrar e ordenar clientes
  const filteredCustomers = useMemo(() => {
    if (!searchValue) return customers;

    const searchLower = searchValue.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        customer.serialNumber.toLowerCase().includes(searchLower) ||
        customer.oltName.toLowerCase().includes(searchLower)
    );
  }, [customers, searchValue]);

  const sortedCustomers = useMemo(() => {
    return stableSort(filteredCustomers, getComparator(order, orderBy));
  }, [filteredCustomers, order, orderBy]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedCustomers.slice(start, start + rowsPerPage);
  }, [sortedCustomers, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);

  // Handlers
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(event.target.value);
      setPage(1); // Reset página quando pesquisar
    },
    []
  );

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
  }, []);

  const handleViewCustomer = useCallback(
    (customerId: string) => {
      navigate(`/clientes/${customerId}`);
    },
    [navigate]
  );

  const handleAddContact = useCallback(() => {
    setAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setAddModalOpen(false);
    setNewCustomerData({
      firstName: '',
      lastName: '',
      email: '',
      cpfCnpj: '',
      phone: '',
      avatar: '/static/avatar/001-man.svg',
    });
  }, []);

  const handleSaveNewCustomer = useCallback(() => {
    console.log('Salvar novo cliente:', newCustomerData);
    // Aqui você implementaria a lógica para salvar o cliente
    handleCloseAddModal();
  }, [newCustomerData, handleCloseAddModal]);

  const handleNewCustomerDataChange = useCallback(
    (field: string, value: string) => {
      setNewCustomerData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleViewChange = useCallback(
    (view: 'list' | 'grid') => {
      setCurrentView(view);
      setPage(1);
      // Ajustar itens por página baseado na view
      if (view === 'grid' && rowsPerPage > 24) {
        setRowsPerPage(12);
      } else if (view === 'list' && rowsPerPage < 5) {
        setRowsPerPage(10);
      }
    },
    [rowsPerPage]
  );

  const handleEditCustomer = useCallback((customer: Customer) => {
    setCustomerToEdit(customer);
    setSelectedAvatar(customer.avatar || '');
    setEditModalOpen(true);
  }, []);

  const handleDeleteCustomer = useCallback(
    (customerId: string) => {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setCustomerToDelete(customer);
        setDeleteModalOpen(true);
      }
    },
    [customers]
  );

  const confirmDeleteCustomer = useCallback(() => {
    if (customerToDelete) {
      console.log('Deletar cliente:', customerToDelete.id);
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(undefined);
      }
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  }, [customerToDelete, selectedCustomer]);

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setCustomerToEdit(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setCustomerToDelete(null);
  }, []);

  const isCustomerSelected = useCallback(
    (customerId: string) => {
      return selectedCustomer?.id === customerId;
    },
    [selectedCustomer]
  );

  return (
    <Box sx={{ p: 2, minHeight: '100vh' }}>
      <Grid
        container
        spacing={1}
        sx={{
          '& .MuiGrid-item': {
            transition: 'none !important',
            transform: 'none !important',
          },
          '& .MuiGrid-root': {
            transition: 'none !important',
            transform: 'none !important',
          },
        }}
      >
        {/* Coluna principal */}
        <Grid item lg={9} md={8} xs={12}>
          <Card
            sx={{
              p: 2,
              height: 'calc(100vh - 80px)',
              borderTopRightRadius: { lg: 0, xs: 1 },
              borderBottomRightRadius: { lg: 0, xs: 1 },
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              transition: 'none !important',
              '&:hover': {
                boxShadow: 'none !important',
                transform: 'none !important',
              },
            }}
          >
            {/* Área de busca e controles */}
            <StyledFlexBox>
              <SearchInput
                placeholder="Pesquisar clientes..."
                value={searchValue}
                onChange={handleSearchChange}
              />

              <FlexBox alignItems="center" gap={1}>
                {/* View Toggle */}
                <ViewToggleContainer>
                  <IconButton
                    size="small"
                    onClick={() => handleViewChange('list')}
                    sx={{
                      color:
                        currentView === 'list'
                          ? 'primary.main'
                          : 'text.secondary',
                      backgroundColor: 'transparent',
                      transition: 'none !important',
                      '&:hover': {
                        color:
                          currentView === 'list'
                            ? 'primary.main'
                            : 'text.secondary',
                        backgroundColor: 'transparent !important',
                        transform: 'none !important',
                      },
                      '&:active': {
                        transform: 'none !important',
                      },
                      '&:focus': {
                        transform: 'none !important',
                      },
                    }}
                  >
                    <FormatListIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleViewChange('grid')}
                    sx={{
                      color:
                        currentView === 'grid'
                          ? 'primary.main'
                          : 'text.secondary',
                      backgroundColor: 'transparent',
                      transition: 'none !important',
                      '&:hover': {
                        color:
                          currentView === 'grid'
                            ? 'primary.main'
                            : 'text.secondary',
                        backgroundColor: 'transparent !important',
                        transform: 'none !important',
                      },
                      '&:active': {
                        transform: 'none !important',
                      },
                      '&:focus': {
                        transform: 'none !important',
                      },
                    }}
                  >
                    <AppsIcon fontSize="small" />
                  </IconButton>
                </ViewToggleContainer>
              </FlexBox>
            </StyledFlexBox>

            {/* Conteúdo - Tabela ou Grid */}
            {currentView === 'list' ? (
              <>
                {/* Tabela Material-UI */}
                <TableContainer
                  sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: '#f5f5f5',
                          '& .MuiTableCell-head': {
                            backgroundColor: '#f5f5f5',
                            border: 'none',
                            borderBottom: 'none',
                          },
                        }}
                      >
                        {/* Coluna Nome */}
                        <TableCell
                          sx={{
                            width: '30%',
                            backgroundColor: '#f5f5f5 !important',
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '12px',
                            borderTopLeftRadius: 8,
                            border: 'none',
                          }}
                        >
                          <TableSortLabel
                            active={orderBy === 'name'}
                            direction={orderBy === 'name' ? order : 'asc'}
                            onClick={(event) =>
                              handleRequestSort(event, 'name')
                            }
                            IconComponent={ArrowDownwardIcon}
                            sx={{ color: 'text.secondary !important' }}
                          >
                            Nome
                          </TableSortLabel>
                        </TableCell>

                        {/* Coluna Email */}
                        <TableCell
                          sx={{
                            width: '25%',
                            backgroundColor: '#f5f5f5 !important',
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '12px',
                            border: 'none',
                          }}
                        >
                          <TableSortLabel
                            active={orderBy === 'email'}
                            direction={orderBy === 'email' ? order : 'asc'}
                            onClick={(event) =>
                              handleRequestSort(event, 'email')
                            }
                            IconComponent={ArrowDownwardIcon}
                            sx={{ color: 'text.secondary !important' }}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>

                        {/* Coluna Telefone */}
                        <TableCell
                          sx={{
                            width: '15%',
                            backgroundColor: '#f5f5f5 !important',
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '12px',
                            border: 'none',
                          }}
                        >
                          <TableSortLabel
                            active={orderBy === 'phone'}
                            direction={orderBy === 'phone' ? order : 'asc'}
                            onClick={(event) =>
                              handleRequestSort(event, 'phone')
                            }
                            IconComponent={ArrowDownwardIcon}
                            sx={{ color: 'text.secondary !important' }}
                          >
                            Telefone
                          </TableSortLabel>
                        </TableCell>

                        {/* Coluna CPF/CNPJ */}
                        <TableCell
                          sx={{
                            width: '15%',
                            backgroundColor: '#f5f5f5 !important',
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '12px',
                            border: 'none',
                          }}
                        >
                          <TableSortLabel
                            active={orderBy === 'cpfCnpj'}
                            direction={orderBy === 'cpfCnpj' ? order : 'asc'}
                            onClick={(event) =>
                              handleRequestSort(event, 'cpfCnpj')
                            }
                            IconComponent={ArrowDownwardIcon}
                            sx={{ color: 'text.secondary !important' }}
                          >
                            CPF/CNPJ
                          </TableSortLabel>
                        </TableCell>

                        {/* Coluna Ações */}
                        <TableCell
                          sx={{
                            width: '10%',
                            backgroundColor: '#f5f5f5 !important',
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '12px',
                            textAlign: 'center',
                            borderTopRightRadius: 8,
                            border: 'none',
                          }}
                        >
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                            <Typography variant="h6" color="text.secondary">
                              Nenhum cliente encontrado
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedCustomers.map((customer) => (
                          <TableRow
                            key={customer.id}
                            selected={isCustomerSelected(customer.id)}
                            onClick={() => handleSelectCustomer(customer)}
                            sx={{
                              cursor: 'pointer',
                              transition: 'none !important',
                              '&.Mui-selected': {
                                backgroundColor: 'primary.lighter',
                              },
                              '&:hover': {
                                backgroundColor: function (theme) {
                                  return isCustomerSelected(customer.id)
                                    ? theme.palette.primary.lighter
                                    : 'rgba(0, 0, 0, 0.04)';
                                },
                              },
                              '&.Mui-selected:hover': {
                                backgroundColor: 'primary.lighter',
                              },
                            }}
                          >
                            {/* Nome com Avatar */}
                            <TableCell sx={{ paddingY: 1 }}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Avatar
                                  src={customer.avatar}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'transparent',
                                    fontSize: '14px',
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  fontSize={13}
                                  color="text.primary"
                                  noWrap
                                >
                                  {customer.name}
                                </Typography>
                              </Stack>
                            </TableCell>

                            {/* Email */}
                            <TableCell sx={{ paddingY: 1 }}>
                              <Typography variant="body2" fontSize={13} noWrap>
                                {customer.email}
                              </Typography>
                            </TableCell>

                            {/* Telefone */}
                            <TableCell sx={{ paddingY: 1 }}>
                              <Typography variant="body2" fontSize={13} noWrap>
                                {customer.phone}
                              </Typography>
                            </TableCell>

                            {/* CPF/CNPJ */}
                            <TableCell sx={{ paddingY: 1 }}>
                              <Typography variant="body2" fontSize={13} noWrap>
                                {customer.cpfCnpj || '-'}
                              </Typography>
                            </TableCell>

                            {/* Ações */}
                            <TableCell sx={{ paddingY: 1 }} align="center">
                              <Tooltip title="Visualizar Detalhes">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewCustomer(customer.id);
                                  }}
                                  color="primary"
                                  size="small"
                                  sx={{
                                    transition: 'none !important',
                                    '&:hover': {
                                      backgroundColor: 'transparent !important',
                                      transform: 'none !important',
                                    },
                                    '&:active': {
                                      transform: 'none !important',
                                    },
                                    '&:focus': {
                                      transform: 'none !important',
                                    },
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Paginação */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Itens por página:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={rowsPerPage}
                        onChange={handleChangeRowsPerPage}
                        displayEmpty
                        sx={{
                          fontSize: '14px',
                          '& .MuiSelect-select': {
                            py: 0.5,
                          },
                        }}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 2 }}
                    >
                      {filteredCustomers.length === 0
                        ? '0 de 0'
                        : `${(page - 1) * rowsPerPage + 1}-${Math.min(
                            page * rowsPerPage,
                            filteredCustomers.length
                          )} de ${filteredCustomers.length}`}
                    </Typography>
                  </Box>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handleChangePage}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                  <Grid container spacing={2}>
                    {paginatedCustomers.length === 0 ? (
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <Typography variant="h6" color="text.secondary">
                            Nenhum cliente encontrado
                          </Typography>
                        </Box>
                      </Grid>
                    ) : (
                      paginatedCustomers.map((customer) => (
                        <Grid item lg={4} sm={6} xs={12} key={customer.id}>
                          <CustomerCard
                            customer={customer}
                            isSelected={isCustomerSelected(customer.id)}
                            onSelect={() => handleSelectCustomer(customer)}
                          />
                        </Grid>
                      ))
                    )}
                  </Grid>
                </Box>

                {/* Paginação para Grid */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Itens por página:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={rowsPerPage}
                        onChange={handleChangeRowsPerPage}
                        displayEmpty
                        sx={{
                          fontSize: '14px',
                          '& .MuiSelect-select': {
                            py: 0.5,
                          },
                        }}
                      >
                        <MenuItem value={6}>6</MenuItem>
                        <MenuItem value={12}>12</MenuItem>
                        <MenuItem value={24}>24</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 2 }}
                    >
                      {filteredCustomers.length === 0
                        ? '0 de 0'
                        : `${(page - 1) * rowsPerPage + 1}-${Math.min(
                            page * rowsPerPage,
                            filteredCustomers.length
                          )} de ${filteredCustomers.length}`}
                    </Typography>
                  </Box>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handleChangePage}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </Card>
        </Grid>

        {/* Coluna lateral */}
        <Grid item lg={3} md={4} xs={12}>
          <Stack spacing={2} sx={{ height: 'calc(100vh - 80px)' }}>
            {/* Botão Adicionar Cliente */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddContact}
              sx={{
                py: 1.5,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 1,
                boxShadow: 'none',
                transition: 'none !important',
                '&:hover': {
                  boxShadow: 'none !important',
                  transform: 'none !important',
                },
                '&:active': {
                  transform: 'none !important',
                },
                '&:focus': {
                  transform: 'none !important',
                },
              }}
            >
              Adicionar Cliente
            </Button>

            {/* Detalhes do cliente selecionado */}
            {selectedCustomer ? (
              <Card
                sx={{
                  p: 2,
                  flex: 1,
                  borderTopLeftRadius: { lg: 0, xs: 1 },
                  borderBottomLeftRadius: { lg: 0, xs: 1 },
                  boxShadow: 'none',
                  overflow: 'auto',
                  backgroundColor: 'rgb(244, 244, 244)',
                  transition: 'none !important',
                  '&:hover': {
                    boxShadow: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                {/* Avatar e Info Básica */}
                <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar
                    src={selectedCustomer.avatar}
                    sx={{
                      width: 80,
                      height: 80,
                      backgroundColor: 'transparent',
                      fontSize: '30px',
                    }}
                  />
                  <Box textAlign="center">
                    <Typography
                      variant="h6"
                      sx={{ fontSize: '16px', fontWeight: 600 }}
                    >
                      {selectedCustomer.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '14px' }}
                    >
                      Cliente
                    </Typography>
                  </Box>

                  {/* Botões de Ação */}
                  <Stack direction="row" spacing={1}>
                    {currentView === 'grid' && (
                      <IconButton
                        onClick={() => handleViewCustomer(selectedCustomer.id)}
                        sx={{
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          color: 'primary.main',
                          transition: 'none !important',
                          '&:hover': {
                            backgroundColor:
                              'rgba(25, 118, 210, 0.08) !important',
                            transform: 'none !important',
                          },
                          '&:active': {
                            transform: 'none !important',
                          },
                          '&:focus': {
                            transform: 'none !important',
                          },
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={() => handleEditCustomer(selectedCustomer)}
                      sx={{
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        color: 'primary.main',
                        transition: 'none !important',
                        '&:hover': {
                          backgroundColor:
                            'rgba(25, 118, 210, 0.08) !important',
                          transform: 'none !important',
                        },
                        '&:active': {
                          transform: 'none !important',
                        },
                        '&:focus': {
                          transform: 'none !important',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                      sx={{
                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                        color: 'error.main',
                        transition: 'none !important',
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.08) !important',
                          transform: 'none !important',
                        },
                        '&:active': {
                          transform: 'none !important',
                        },
                        '&:focus': {
                          transform: 'none !important',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Informações Detalhadas */}
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <EmailIcon
                      sx={{ color: 'rgb(107, 114, 128)', fontSize: 20 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}
                    >
                      {selectedCustomer.email}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <PhoneIcon
                      sx={{ color: 'rgb(107, 114, 128)', fontSize: 20 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}
                    >
                      {selectedCustomer.phone}
                    </Typography>
                  </Stack>

                  {selectedCustomer.cpfCnpj && (
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <BadgeIcon
                        sx={{ color: 'rgb(107, 114, 128)', fontSize: 20 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}
                      >
                        {selectedCustomer.cpfCnpj}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Card>
            ) : (
              <Card
                sx={{
                  p: 2,
                  flex: 1,
                  borderTopLeftRadius: { lg: 0, xs: 1 },
                  borderBottomLeftRadius: { lg: 0, xs: 1 },
                  boxShadow: 'none',
                  backgroundColor: 'rgb(244, 244, 244)',
                  transition: 'none !important',
                  '&:hover': {
                    boxShadow: 'none !important',
                    transform: 'none !important',
                  },
                }}
              ></Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Modal de Adicionar Cliente */}
      <Modal
        open={addModalOpen}
        onClose={handleCloseAddModal}
        slotProps={{
          backdrop: {
            sx: {
              transition: 'none !important',
            },
          },
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& .MuiModal-root': {
            transition: 'none !important',
          },
        }}
      >
        <Card
          sx={{
            minWidth: 500,
            maxWidth: 700,
            p: 4,
            outline: 'none',
            borderRadius: 2,
            backgroundColor: 'white',
            transition: 'none !important',
            transform: 'none !important',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Adicionar Novo Cliente
          </Typography>

          <Stack spacing={3}>
            {/* Avatar Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Avatar
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={newCustomerData.avatar}
                  sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: 'transparent',
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const avatars = [
                      '001-man.svg',
                      '002-girl.svg',
                      '003-boy.svg',
                      '004-woman.svg',
                      '005-man-1.svg',
                      '006-woman-1.svg',
                      '007-boy-1.svg',
                      '008-clown.svg',
                      '009-firefighter.svg',
                      '010-girl-1.svg',
                      '011-man-2.svg',
                      '012-woman-2.svg',
                      '013-woman-3.svg',
                      '014-man-3.svg',
                      '015-woman-4.svg',
                      '016-boy-2.svg',
                      '017-girl-2.svg',
                      '018-boy-3.svg',
                      '019-woman-5.svg',
                      '020-man-4.svg',
                      '021-girl-3.svg',
                      '022-man-5.svg',
                      '023-man-6.svg',
                      '024-woman-6.svg',
                      '025-boy-4.svg',
                      '026-girl-4.svg',
                      '027-man-7.svg',
                      '028-woman-7.svg',
                      '029-man-8.svg',
                      '030-policewoman.svg',
                      '031-policeman.svg',
                      '032-girl-5.svg',
                      '033-superhero.svg',
                      '034-woman-8.svg',
                      '035-woman-9.svg',
                      '036-man-9.svg',
                      '037-arab-woman.svg',
                      '038-man-10.svg',
                      '039-woman-10.svg',
                      '040-man-11.svg',
                      '041-woman-11.svg',
                      '042-vampire.svg',
                      '043-chef.svg',
                      '044-farmer.svg',
                      '045-man-12.svg',
                      '046-woman-12.svg',
                      '047-man-13.svg',
                      '048-boy-5.svg',
                      '049-thief.svg',
                      '050-catwoman.svg',
                      '051-american-football-player.svg',
                      '052-witch.svg',
                      '053-concierge.svg',
                      '054-woman-13.svg',
                      '055-bodybuilder.svg',
                      '056-girl-6.svg',
                      '057-woman-14.svg',
                      '058-death.svg',
                      '059-doctor.svg',
                      '060-doctor-1.svg',
                      '061-nun.svg',
                      '062-builder.svg',
                      '063-girl-7.svg',
                      '064-punk.svg',
                      '065-pinup.svg',
                      '066-boy-6.svg',
                      '067-man-14.svg',
                      '068-girl-8.svg',
                      '069-woman-15.svg',
                      '070-man-15.svg',
                    ];
                    const randomAvatar =
                      avatars[Math.floor(Math.random() * avatars.length)];
                    handleNewCustomerDataChange(
                      'avatar',
                      `/static/avatar/${randomAvatar}`
                    );
                  }}
                >
                  Alterar Avatar
                </Button>
              </Stack>
            </Box>

            {/* Nome */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Primeiro Nome"
                value={newCustomerData.firstName}
                onChange={(e) =>
                  handleNewCustomerDataChange('firstName', e.target.value)
                }
                fullWidth
                size="small"
                required
              />
              <TextField
                label="Último Nome"
                value={newCustomerData.lastName}
                onChange={(e) =>
                  handleNewCustomerDataChange('lastName', e.target.value)
                }
                fullWidth
                size="small"
                required
              />
            </Stack>

            {/* Email */}
            <TextField
              label="Email"
              value={newCustomerData.email}
              onChange={(e) =>
                handleNewCustomerDataChange('email', e.target.value)
              }
              fullWidth
              size="small"
              type="email"
              required
            />

            {/* CPF/CNPJ */}
            <TextField
              label="CPF/CNPJ"
              value={newCustomerData.cpfCnpj}
              onChange={(e) =>
                handleNewCustomerDataChange('cpfCnpj', e.target.value)
              }
              fullWidth
              size="small"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              required
            />

            {/* Telefone */}
            <TextField
              label="Telefone"
              value={newCustomerData.phone}
              onChange={(e) =>
                handleNewCustomerDataChange('phone', e.target.value)
              }
              fullWidth
              size="small"
              type="tel"
              placeholder="(00) 00000-0000"
              required
            />

            {/* Botões de Ação */}
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSaveNewCustomer}
                sx={{ flex: 1 }}
                disabled={
                  !newCustomerData.firstName ||
                  !newCustomerData.lastName ||
                  !newCustomerData.email ||
                  !newCustomerData.cpfCnpj ||
                  !newCustomerData.phone
                }
              >
                Salvar
              </Button>
              <Button
                variant="outlined"
                onClick={handleCloseAddModal}
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        slotProps={{
          backdrop: {
            sx: {
              transition: 'none !important',
            },
          },
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& .MuiModal-root': {
            transition: 'none !important',
          },
        }}
      >
        <Card
          sx={{
            minWidth: 500,
            maxWidth: 700,
            p: 4,
            outline: 'none',
            borderRadius: 2,
            backgroundColor: 'white',
            transition: 'none !important',
            transform: 'none !important',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Editar Cliente
          </Typography>

          {customerToEdit && (
            <Stack spacing={3}>
              {/* Avatar Selection */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Avatar
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    src={selectedAvatar}
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: 'transparent',
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const avatars = [
                        '001-man.svg',
                        '002-girl.svg',
                        '003-boy.svg',
                        '004-woman.svg',
                        '005-man-1.svg',
                        '006-woman-1.svg',
                        '007-boy-1.svg',
                        '008-clown.svg',
                        '009-firefighter.svg',
                        '010-girl-1.svg',
                        '011-man-2.svg',
                        '012-woman-2.svg',
                        '013-woman-3.svg',
                        '014-man-3.svg',
                        '015-woman-4.svg',
                        '016-boy-2.svg',
                        '017-girl-2.svg',
                        '018-boy-3.svg',
                        '019-woman-5.svg',
                        '020-man-4.svg',
                        '021-girl-3.svg',
                        '022-man-5.svg',
                        '023-man-6.svg',
                        '024-woman-6.svg',
                        '025-boy-4.svg',
                        '026-girl-4.svg',
                        '027-man-7.svg',
                        '028-woman-7.svg',
                        '029-man-8.svg',
                        '030-policewoman.svg',
                        '031-policeman.svg',
                        '032-girl-5.svg',
                        '033-superhero.svg',
                        '034-woman-8.svg',
                        '035-woman-9.svg',
                        '036-man-9.svg',
                        '037-arab-woman.svg',
                        '038-man-10.svg',
                        '039-woman-10.svg',
                        '040-man-11.svg',
                        '041-woman-11.svg',
                        '042-vampire.svg',
                        '043-chef.svg',
                        '044-farmer.svg',
                        '045-man-12.svg',
                        '046-woman-12.svg',
                        '047-man-13.svg',
                        '048-boy-5.svg',
                        '049-thief.svg',
                        '050-catwoman.svg',
                        '051-american-football-player.svg',
                        '052-witch.svg',
                        '053-concierge.svg',
                        '054-woman-13.svg',
                        '055-bodybuilder.svg',
                        '056-girl-6.svg',
                        '057-woman-14.svg',
                        '058-death.svg',
                        '059-doctor.svg',
                        '060-doctor-1.svg',
                        '061-nun.svg',
                        '062-builder.svg',
                        '063-girl-7.svg',
                        '064-punk.svg',
                        '065-pinup.svg',
                        '066-boy-6.svg',
                        '067-man-14.svg',
                        '068-girl-8.svg',
                        '069-woman-15.svg',
                        '070-man-15.svg',
                      ];
                      const randomAvatar =
                        avatars[Math.floor(Math.random() * avatars.length)];
                      setSelectedAvatar(`/static/avatar/${randomAvatar}`);
                    }}
                  >
                    Alterar Avatar
                  </Button>
                </Stack>
              </Box>

              {/* Nome */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Primeiro Nome"
                  defaultValue={customerToEdit.name.split(' ')[0] || ''}
                  fullWidth
                  size="small"
                  required
                />
                <TextField
                  label="Último Nome"
                  defaultValue={
                    customerToEdit.name.split(' ').slice(1).join(' ') || ''
                  }
                  fullWidth
                  size="small"
                  required
                />
              </Stack>

              {/* Email */}
              <TextField
                label="Email"
                defaultValue={customerToEdit.email}
                fullWidth
                size="small"
                type="email"
                required
              />

              {/* CPF/CNPJ */}
              <TextField
                label="CPF/CNPJ"
                defaultValue={customerToEdit.cpfCnpj || ''}
                fullWidth
                size="small"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                required
              />

              {/* Telefone */}
              <TextField
                label="Telefone"
                defaultValue={customerToEdit.phone}
                fullWidth
                size="small"
                type="tel"
                placeholder="(00) 00000-0000"
                required
              />

              {/* Botões de Ação */}
              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    console.log('Salvar alterações', {
                      avatar: selectedAvatar,
                    });
                    handleCloseEditModal();
                  }}
                  sx={{ flex: 1 }}
                >
                  Salvar
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCloseEditModal}
                  sx={{ flex: 1 }}
                >
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          )}
        </Card>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o cliente{' '}
            <strong>{customerToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDeleteModal}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteCustomer}
            variant="contained"
            color="error"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clientes;
