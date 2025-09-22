import FlexBox from '@shared/ui/components/FlexBox';
import { H6, Small, Tiny } from '@shared/ui/components/Typography';
import UkoAvatar from '@shared/ui/components/UkoAvatar';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { Customer } from '@entities/customer/model/customerTypes';

const CustomerListColumnShape = [
  {
    id: 'name',
    header: 'Nome',
    accessorKey: 'name',
    minSize: 200,
    cell: ({ row }: { row: { original: Customer } }) => {
      const { avatar, name, email } = row.original;
      return (
        <FlexBox alignItems="center">
          <UkoAvatar src={avatar} />
          <FlexBox flexDirection="column" ml={1}>
            <H6 color="text.primary">{name}</H6>
            <Tiny color="text.disabled">{email}</Tiny>
          </FlexBox>
        </FlexBox>
      );
    },
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    minSize: 200,
    cell: ({ getValue }: { getValue: () => string }) => (
      <Small color="text.primary">{getValue()}</Small>
    ),
  },
  {
    id: 'phone',
    header: 'Telefone',
    accessorKey: 'phone',
    minSize: 150,
    cell: ({ getValue }: { getValue: () => string }) => (
      <Small color="text.primary">{getValue()}</Small>
    ),
  },
  {
    id: 'actions',
    header: 'Ações',
    accessorKey: 'id',
    minSize: 100,
    maxSize: 100,
    cell: ({ row }: { row: { original: Customer } }) => (
      <Box display="flex" justifyContent="center">
        <Tooltip title="Visualizar Detalhes">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              // O handler será passado via props ou context
            }}
            color="primary"
            size="small"
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

export default CustomerListColumnShape;
