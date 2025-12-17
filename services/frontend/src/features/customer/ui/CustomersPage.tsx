import React, { useCallback, useMemo, useState } from 'react';
import { Add as AddIcon, Apps as AppsIcon, ArrowDownward as ArrowDownwardIcon, Badge as BadgeIcon, Delete as DeleteIcon, Edit as EditIcon, Email as EmailIcon, FormatListBulleted as FormatListIcon, Phone as PhoneIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Avatar, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, MenuItem, Pagination, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Customer } from '@entities/customer/model/customerTypes';
import { getComparator, stableSort } from '@shared/lib/hooks/useMuiTable';
import { ConfirmDialog, FlexBox, SearchInput } from '@shared/ui/components';
import { DEFAULT_AVATAR_PATH, getRandomAvatarPath } from '../lib';
import { CustomerCard } from './CustomerCard';

type Props = {
  customers: Customer[];
  onViewCustomer?: (customerId: string) => void;
};

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

export const CustomersPage: React.FC<Props> = ({ customers, onViewCustomer }) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [currentView, setCurrentView] = useState<'list' | 'grid'>('list');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');

  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    avatar: DEFAULT_AVATAR_PATH,
  });

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof Customer>('name');

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

  const sortedCustomers = useMemo(() => stableSort(filteredCustomers, getComparator(order, orderBy)), [filteredCustomers, order, orderBy]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedCustomers.slice(start, start + rowsPerPage);
  }, [sortedCustomers, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);

  const handleRequestSort = useCallback(
    (event: React.MouseEvent<unknown>, property: keyof Customer) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [order, orderBy]
  );

  const handleChangePage = useCallback((event: React.ChangeEvent<unknown>, newPage: number) => setPage(newPage), []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    setRowsPerPage(parseInt(event.target.value as string, 10));
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setPage(1);
  }, []);

  const handleSelectCustomer = useCallback((customer: Customer) => setSelectedCustomer(customer), []);

  const handleAddContact = useCallback(() => setAddModalOpen(true), []);

  const handleCloseAddModal = useCallback(() => {
    setAddModalOpen(false);
    setNewCustomerData({
      firstName: '',
      lastName: '',
      email: '',
      cpfCnpj: '',
      phone: '',
      avatar: DEFAULT_AVATAR_PATH,
    });
  }, []);

  const handleSaveNewCustomer = useCallback(() => {
    console.log('Salvar novo cliente:', newCustomerData);
    handleCloseAddModal();
  }, [newCustomerData, handleCloseAddModal]);

  const handleNewCustomerDataChange = useCallback((field: string, value: string) => {
    setNewCustomerData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleViewChange = useCallback(
    (view: 'list' | 'grid') => {
      setCurrentView(view);
      setPage(1);
      if (view === 'grid' && rowsPerPage > 24) setRowsPerPage(12);
      if (view === 'list' && rowsPerPage < 5) setRowsPerPage(10);
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
      if (!customer) return;
      setCustomerToDelete(customer);
      setDeleteModalOpen(true);
    },
    [customers]
  );

  const confirmDeleteCustomer = useCallback(() => {
    if (!customerToDelete) return;
    console.log('Deletar cliente:', customerToDelete.id);
    if (selectedCustomer?.id === customerToDelete.id) setSelectedCustomer(undefined);
    setDeleteModalOpen(false);
    setCustomerToDelete(null);
  }, [customerToDelete, selectedCustomer]);

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setCustomerToEdit(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setCustomerToDelete(null);
  }, []);

  const isCustomerSelected = useCallback((customerId: string) => selectedCustomer?.id === customerId, [selectedCustomer]);

  return (
    <Box sx={{ p: 2, minHeight: '100vh' }}>
      <Grid
        container
        spacing={1}
        sx={{
          '& .MuiGrid-item': { transition: 'none !important', transform: 'none !important' },
          '& .MuiGrid-root': { transition: 'none !important', transform: 'none !important' },
        }}
      >
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
              '&:hover': { boxShadow: 'none !important', transform: 'none !important' },
            }}
          >
            <StyledFlexBox>
              <SearchInput placeholder="Pesquisar clientes..." value={searchValue} onChange={handleSearchChange} />
              <FlexBox alignItems="center" gap={1}>
                <ViewToggleContainer>
                  <IconButton
                    size="small"
                    onClick={() => handleViewChange('list')}
                    sx={{
                      color: currentView === 'list' ? 'primary.main' : 'text.secondary',
                      backgroundColor: 'transparent',
                      transition: 'none !important',
                      '&:hover': { color: currentView === 'list' ? 'primary.main' : 'text.secondary', backgroundColor: 'transparent !important', transform: 'none !important' },
                      '&:active': { transform: 'none !important' },
                      '&:focus': { transform: 'none !important' },
                    }}
                  >
                    <FormatListIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleViewChange('grid')}
                    sx={{
                      color: currentView === 'grid' ? 'primary.main' : 'text.secondary',
                      backgroundColor: 'transparent',
                      transition: 'none !important',
                      '&:hover': { color: currentView === 'grid' ? 'primary.main' : 'text.secondary', backgroundColor: 'transparent !important', transform: 'none !important' },
                      '&:active': { transform: 'none !important' },
                      '&:focus': { transform: 'none !important' },
                    }}
                  >
                    <AppsIcon fontSize="small" />
                  </IconButton>
                </ViewToggleContainer>
              </FlexBox>
            </StyledFlexBox>

            {currentView === 'list' ? (
              <>
                <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: '#f5f5f5',
                          '& .MuiTableCell-head': { backgroundColor: '#f5f5f5', border: 'none', borderBottom: 'none' },
                        }}
                      >
                        <TableCell sx={{ width: '30%', backgroundColor: '#f5f5f5 !important', color: 'text.secondary', fontWeight: 600, fontSize: '12px', borderTopLeftRadius: 8, border: 'none' }}>
                          <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={(event) => handleRequestSort(event, 'name')} IconComponent={ArrowDownwardIcon} sx={{ color: 'text.secondary !important' }}>
                            Nome
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '25%', backgroundColor: '#f5f5f5 !important', color: 'text.secondary', fontWeight: 600, fontSize: '12px', border: 'none' }}>
                          <TableSortLabel active={orderBy === 'email'} direction={orderBy === 'email' ? order : 'asc'} onClick={(event) => handleRequestSort(event, 'email')} IconComponent={ArrowDownwardIcon} sx={{ color: 'text.secondary !important' }}>
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '15%', backgroundColor: '#f5f5f5 !important', color: 'text.secondary', fontWeight: 600, fontSize: '12px', border: 'none' }}>
                          <TableSortLabel active={orderBy === 'phone'} direction={orderBy === 'phone' ? order : 'asc'} onClick={(event) => handleRequestSort(event, 'phone')} IconComponent={ArrowDownwardIcon} sx={{ color: 'text.secondary !important' }}>
                            Telefone
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '15%', backgroundColor: '#f5f5f5 !important', color: 'text.secondary', fontWeight: 600, fontSize: '12px', border: 'none' }}>
                          <TableSortLabel active={orderBy === 'cpfCnpj'} direction={orderBy === 'cpfCnpj' ? order : 'asc'} onClick={(event) => handleRequestSort(event, 'cpfCnpj')} IconComponent={ArrowDownwardIcon} sx={{ color: 'text.secondary !important' }}>
                            CPF/CNPJ
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '10%', backgroundColor: '#f5f5f5 !important', color: 'text.secondary', fontWeight: 600, fontSize: '12px', textAlign: 'center', borderTopRightRadius: 8, border: 'none' }}>
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
                              '&.Mui-selected': { backgroundColor: 'primary.lighter' },
                              '&:hover': { backgroundColor: (theme) => (isCustomerSelected(customer.id) ? theme.palette.primary.lighter : 'rgba(0, 0, 0, 0.04)') },
                              '&.Mui-selected:hover': { backgroundColor: 'primary.lighter' },
                            }}
                          >
                            <TableCell sx={{ paddingY: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Avatar src={customer.avatar} sx={{ width: 32, height: 32, backgroundColor: 'transparent', fontSize: '14px' }} />
                                <Typography variant="body2" fontSize={13} color="text.primary" noWrap>
                                  {customer.name}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ paddingY: 1 }}>
                              <Typography variant="body2" fontSize={13} noWrap>
                                {customer.email}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ paddingY: 1 }}>
                              <Typography variant="body2" fontSize={13} noWrap>
                                {customer.phone}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ paddingY: 1 }}>
                              <Typography variant="body2" fontSize={13} noWrap>
                                {customer.cpfCnpj || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ paddingY: 1 }} align="center">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewCustomer?.(customer.id);
                                }}
                                color="primary"
                                size="small"
                                sx={{
                                  transition: 'none !important',
                                  '&:hover': { backgroundColor: 'transparent !important', transform: 'none !important' },
                                  '&:active': { transform: 'none !important' },
                                  '&:focus': { transform: 'none !important' },
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Itens por página:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select value={rowsPerPage} onChange={handleChangeRowsPerPage} displayEmpty sx={{ fontSize: '14px', '& .MuiSelect-select': { py: 0.5 } }} MenuProps={{ disableScrollLock: true }}>
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      {filteredCustomers.length === 0 ? '0 de 0' : `${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, filteredCustomers.length)} de ${filteredCustomers.length}`}
                    </Typography>
                  </Box>
                  <Pagination count={totalPages} page={page} onChange={handleChangePage} color="primary" shape="rounded" showFirstButton showLastButton />
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
                          <CustomerCard customer={customer} isSelected={isCustomerSelected(customer.id)} onSelect={() => handleSelectCustomer(customer)} />
                        </Grid>
                      ))
                    )}
                  </Grid>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Itens por página:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select value={rowsPerPage} onChange={handleChangeRowsPerPage} displayEmpty sx={{ fontSize: '14px', '& .MuiSelect-select': { py: 0.5 } }} MenuProps={{ disableScrollLock: true }}>
                        <MenuItem value={6}>6</MenuItem>
                        <MenuItem value={12}>12</MenuItem>
                        <MenuItem value={24}>24</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      {filteredCustomers.length === 0 ? '0 de 0' : `${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, filteredCustomers.length)} de ${filteredCustomers.length}`}
                    </Typography>
                  </Box>
                  <Pagination count={totalPages} page={page} onChange={handleChangePage} color="primary" shape="rounded" showFirstButton showLastButton />
                </Box>
              </>
            )}
          </Card>
        </Grid>

        <Grid item lg={3} md={4} xs={12}>
          <Stack spacing={2} sx={{ height: 'calc(100vh - 80px)' }}>
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
                '&:hover': { boxShadow: 'none !important', transform: 'none !important' },
                '&:active': { transform: 'none !important' },
                '&:focus': { transform: 'none !important' },
              }}
            >
              Adicionar Cliente
            </Button>

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
                  '&:hover': { boxShadow: 'none !important', transform: 'none !important' },
                }}
              >
                <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar src={selectedCustomer.avatar} sx={{ width: 80, height: 80, backgroundColor: 'transparent', fontSize: '30px' }} />
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                      {selectedCustomer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                      Cliente
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    {currentView === 'grid' && (
                      <IconButton
                        onClick={() => onViewCustomer?.(selectedCustomer.id)}
                        sx={{
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          color: 'primary.main',
                          transition: 'none !important',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08) !important', transform: 'none !important' },
                          '&:active': { transform: 'none !important' },
                          '&:focus': { transform: 'none !important' },
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
                        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08) !important', transform: 'none !important' },
                        '&:active': { transform: 'none !important' },
                        '&:focus': { transform: 'none !important' },
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
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08) !important', transform: 'none !important' },
                        '&:active': { transform: 'none !important' },
                        '&:focus': { transform: 'none !important' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <EmailIcon sx={{ color: 'rgb(107, 114, 128)', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}>
                      {selectedCustomer.email}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <PhoneIcon sx={{ color: 'rgb(107, 114, 128)', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}>
                      {selectedCustomer.phone}
                    </Typography>
                  </Stack>
                  {selectedCustomer.cpfCnpj && (
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <BadgeIcon sx={{ color: 'rgb(107, 114, 128)', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgb(244, 244, 244)',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Selecione um cliente para ver detalhes
                </Typography>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={addModalOpen} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Cliente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={newCustomerData.avatar} sx={{ width: 60, height: 60, backgroundColor: 'transparent' }} />
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Avatar
                </Typography>
                <Button variant="outlined" size="small" onClick={() => handleNewCustomerDataChange('avatar', getRandomAvatarPath())}>
                  Alterar Avatar
                </Button>
              </Stack>
            </Box>

            <Stack direction="row" spacing={2}>
              <TextField label="Primeiro Nome" value={newCustomerData.firstName} onChange={(e) => handleNewCustomerDataChange('firstName', e.target.value)} fullWidth size="small" required />
              <TextField label="Último Nome" value={newCustomerData.lastName} onChange={(e) => handleNewCustomerDataChange('lastName', e.target.value)} fullWidth size="small" required />
            </Stack>
            <TextField label="Email" value={newCustomerData.email} onChange={(e) => handleNewCustomerDataChange('email', e.target.value)} fullWidth size="small" type="email" required />
            <TextField label="CPF/CNPJ" value={newCustomerData.cpfCnpj} onChange={(e) => handleNewCustomerDataChange('cpfCnpj', e.target.value)} fullWidth size="small" placeholder="000.000.000-00 ou 00.000.000/0000-00" required />
            <TextField label="Telefone" value={newCustomerData.phone} onChange={(e) => handleNewCustomerDataChange('phone', e.target.value)} fullWidth size="small" type="tel" placeholder="(00) 00000-0000" required />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={handleSaveNewCustomer}
            disabled={!newCustomerData.firstName || !newCustomerData.lastName || !newCustomerData.email || !newCustomerData.cpfCnpj || !newCustomerData.phone}
          >
            Salvar
          </Button>
          <Button variant="outlined" onClick={handleCloseAddModal}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogContent>
          {customerToEdit && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedAvatar} sx={{ width: 60, height: 60, backgroundColor: 'transparent' }} />
                <Button variant="outlined" size="small" onClick={() => setSelectedAvatar(getRandomAvatarPath())}>
                  Alterar Avatar
                </Button>
              </Box>
              <Stack direction="row" spacing={2}>
                <TextField label="Primeiro Nome" defaultValue={customerToEdit.name.split(' ')[0] || ''} fullWidth size="small" required />
                <TextField label="Último Nome" defaultValue={customerToEdit.name.split(' ').slice(1).join(' ') || ''} fullWidth size="small" required />
              </Stack>
              <TextField label="Email" defaultValue={customerToEdit.email} fullWidth size="small" type="email" required />
              <TextField label="CPF/CNPJ" defaultValue={customerToEdit.cpfCnpj || ''} fullWidth size="small" placeholder="000.000.000-00 ou 00.000.000/0000-00" required />
              <TextField label="Telefone" defaultValue={customerToEdit.phone} fullWidth size="small" type="tel" placeholder="(00) 00000-0000" required />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              console.log('Salvar alterações', { avatar: selectedAvatar });
              handleCloseEditModal();
            }}
          >
            Salvar
          </Button>
          <Button variant="outlined" onClick={handleCloseEditModal}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteModalOpen}
        title="Confirmar Exclusão"
        description={
          <>
            <Typography>
              Tem certeza que deseja excluir o cliente <strong>{customerToDelete?.name}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Esta ação não pode ser desfeita.
            </Typography>
          </>
        }
        cancelText="Cancelar"
        confirmText="Excluir"
        confirmColor="error"
        onConfirm={confirmDeleteCustomer}
        onClose={handleCloseDeleteModal}
      />
    </Box>
  );
};
