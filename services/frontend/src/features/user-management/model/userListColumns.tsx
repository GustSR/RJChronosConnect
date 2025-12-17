import { Box } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import FlexBox from '@shared/ui/components/FlexBox';
import { H6, Small, Tiny } from '@shared/ui/components/Typography';
import UkoAvatar from '@shared/ui/components/UkoAvatar';
import type { UserListItem } from './types';

export const userListColumns: ColumnDef<UserListItem>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    minSize: 200,
    cell: ({ row }) => {
      const { avatar, name, address } = row.original;
      return (
        <FlexBox alignItems="center">
          <UkoAvatar src={avatar} />
          <FlexBox flexDirection="column" ml={1}>
            <H6 color="text.primary">{name}</H6>
            <Tiny color="text.disabled">{address}</Tiny>
          </FlexBox>
        </FlexBox>
      );
    },
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    minSize: 200,
    cell: ({ getValue }) => (
      <Small
        sx={{
          borderRadius: 10,
          padding: '.2rem 1rem',
          color: 'background.paper',
          backgroundColor: '#A798FF',
        }}
      >
        {getValue<string>()}
      </Small>
    ),
  },
  {
    id: 'company',
    header: 'Company',
    accessorKey: 'company',
    minSize: 150,
  },
  {
    id: 'project',
    header: 'Project',
    accessorKey: 'project',
    minSize: 150,
  },
  {
    id: 'verified',
    header: 'Verified',
    accessorKey: 'verified',
    minSize: 100,
    maxSize: 100,
    cell: ({ getValue }) => <Box>{getValue<string>()}</Box>,
  },
];

