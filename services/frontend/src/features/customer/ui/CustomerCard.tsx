import React from 'react';
import { Card, Stack, Avatar, Typography, Box } from '@mui/material';
import { Customer } from '@entities/customer/model/customerTypes';

interface CustomerCardProps {
  customer: Customer;
  isSelected: boolean;
  onSelect: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  isSelected,
  onSelect,
}) => {
  return (
    <Card
      onClick={onSelect}
      sx={{
        p: 2,
        cursor: 'pointer',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        backgroundColor: isSelected
          ? 'rgba(25, 118, 210, 0.04)'
          : 'background.paper',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        className="truncate"
      >
        <Avatar
          src={customer.avatar}
          sx={{
            width: 48,
            height: 48,
            backgroundColor: 'transparent',
            fontSize: '18px',
          }}
        />

        <Box className="truncate" sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: isSelected ? 600 : 500,
              color: isSelected ? 'primary.main' : 'text.primary',
              fontSize: '14px',
            }}
          >
            {customer.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isSelected ? 'primary.main' : 'text.secondary',
              fontSize: '12px',
            }}
          >
            {customer.position || 'Cliente'}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
};
