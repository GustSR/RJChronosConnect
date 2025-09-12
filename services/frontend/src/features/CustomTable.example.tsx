import { ColumnDef } from '@tanstack/react-table';
import CustomTable from './CustomTable';

// Exemplo de como usar o novo CustomTable com @tanstack/react-table

// 1. Definir o tipo dos dados
interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

// 2. Definir as colunas usando ColumnDef
const userColumns: ColumnDef<UserData>[] = [
  {
    id: 'id',
    header: 'ID',
    accessorKey: 'id',
    enableSorting: true,
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    enableSorting: true,
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    enableSorting: true,
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    enableSorting: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    enableSorting: true,
    // Custom cell renderer
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <span
          style={{
            color: status === 'active' ? 'green' : 'red',
            fontWeight: 'bold',
          }}
        >
          {status}
        </span>
      );
    },
  },
];

// 3. Dados de exemplo
const userData: UserData[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'inactive',
  },
  // ... mais dados
];

// 4. Componente de exemplo
export const UserTableExample = () => {
  const handleRowClick = (user: UserData) => {
    console.log('Clicked user:', user);
  };

  return (
    <CustomTable
      columns={userColumns}
      data={userData}
      rowClick={handleRowClick}
      pageSize={10}
      showFooter={true}
    />
  );
};

// 5. Helper para converter formato antigo para o novo (compatibilidade)
export const convertLegacyColumns = (
  legacyColumns: any[]
): ColumnDef<any>[] => {
  return legacyColumns.map((col) => ({
    id: col.accessor || col.id,
    header: col.Header || col.header,
    accessorKey: col.accessor,
    enableSorting: true,
    cell: col.Cell
      ? ({ getValue, row }) =>
          col.Cell({ value: getValue(), row: row.original })
      : undefined,
  }));
};

// Exemplo de uso do converter:
// const newColumns = convertLegacyColumns(oldColumnShape);
// <CustomTable columns={newColumns} data={data} />
