import { ArrowRightAlt } from '@mui/icons-material';
import { Box, ButtonBase, Pagination, Stack, styled, Table, TableBody, TableCell, TableHead, TableRow, useTheme } from '@mui/material';
import { FlexBox, H5 } from '@shared/ui/components';
import { useState } from 'react';
import { ColumnDef, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import ScrollBar from 'simplebar-react';

type Props<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  rowClick?: (rowData: TData) => void;
  hidePagination?: boolean;
  showFooter?: boolean;
  pageSize?: number;
};

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    fontSize: 12,
    fontWeight: 500,
    color: theme.palette.text.disabled,
  },
  '& .MuiPaginationItem-page:hover': {
    borderRadius: 20,
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primary.main}`,
  },
  '& .MuiPaginationItem-page.Mui-selected': {
    borderRadius: 20,
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primary.main}`,
  },
  '& .MuiPaginationItem-previousNext': {
    margin: 10,
    borderRadius: 20,
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primary.main}`,
    '&:hover': { backgroundColor: 'transparent' },
  },
}));

const CustomTable = <TData,>(props: Props<TData>) => {
  const { data, rowClick, showFooter, columns, hidePagination, pageSize = 10 } =
    props;
  const theme = useTheme();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const borderColor =
    theme.palette.mode === 'light' ? 'text.secondary' : 'divider';

  return (
    <Box>
      <ScrollBar>
        <Table sx={{ borderSpacing: '0 1rem', borderCollapse: 'separate' }}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{
                      paddingY: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      borderBottom: 0,
                      color: 'text.disabled',
                      '&:last-child': { textAlign: 'center' },
                      cursor: header.column.getCanSort()
                        ? 'pointer'
                        : 'default',
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {{
                      asc: ' ↑',
                      desc: ' ↓',
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => rowClick?.(row.original)}
                sx={{
                  backgroundColor: 'background.paper',
                  cursor: rowClick ? 'pointer' : 'unset',
                  '& td:first-of-type': {
                    borderLeft: '1px solid',
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    borderColor,
                  },
                  '& td:last-of-type': {
                    textAlign: 'center',
                    borderRight: '1px solid',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                    borderColor,
                  },
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'text.disabled',
                      borderTop: '1px solid',
                      borderBottom: '1px solid',
                      borderColor,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollBar>

      {!hidePagination ? (
        <Stack alignItems="flex-end" marginY={1}>
          <StyledPagination
            count={table.getPageCount()}
            page={table.getState().pagination.pageIndex + 1}
            onChange={(_, page) => table.setPageIndex(page - 1)}
            shape="rounded"
          />
        </Stack>
      ) : null}

      {showFooter ? (
        <FlexBox alignItems="center" justifyContent="space-between">
          <H5 color="text.disabled">
            Showing{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </H5>
          <ButtonBase
            disableRipple
            sx={{
              fontSize: 14,
              fontWeight: 600,
            }}
            onClick={() => table.setPageIndex(0)}
          >
            See All
            <ArrowRightAlt sx={{ marginLeft: 0.5 }} />
          </ButtonBase>
        </FlexBox>
      ) : null}
    </Box>
  );
};

export default CustomTable;
