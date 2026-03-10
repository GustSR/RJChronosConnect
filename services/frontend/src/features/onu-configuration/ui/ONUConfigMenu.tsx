import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

import { menuItems } from '../menuItems';
import type { ConfigurationTabId } from '../types';

type Props = {
  selectedItem: ConfigurationTabId | '';
  onSelect: (id: ConfigurationTabId) => void;
};

export function ONUConfigMenu({ selectedItem, onSelect }: Props) {
  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
          Opções de Configuração
        </Typography>

        <Grid container spacing={2}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = selectedItem === item.id;

            return (
              <Grid item xs={12} sm={6} key={item.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: isSelected ? '2px solid' : '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => onSelect(item.id)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                    >
                      <IconComponent
                        color={isSelected ? 'primary' : 'action'}
                        fontSize="medium"
                      />
                      <Typography
                        variant="body1"
                        fontWeight={isSelected ? 600 : 500}
                        color={isSelected ? 'primary.main' : 'text.primary'}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
