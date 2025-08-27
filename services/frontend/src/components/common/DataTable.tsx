import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

interface DataTableProps {
  title: string;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  data: any[];
  actions?: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({ title, columns, data, actions }) => {
  return (
    <Card sx={{ boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {actions && <Box>{actions}</Box>}
        </Box>
        
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key} 
                    style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  style={{ 
                    backgroundColor: rowIndex % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DataTable;