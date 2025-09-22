import React from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import {
  Search as SearchIcon,
  FormatListBulleted as FormatListIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';

interface SearchAreaProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  showViewToggle?: boolean;
  currentView?: 'list' | 'grid';
  onViewChange?: (view: 'list' | 'grid') => void;
}

export const SearchArea: React.FC<SearchAreaProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  showViewToggle = false,
  currentView = 'list',
  onViewChange,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        mt: 0.5,
      }}
    >
      <TextField
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        sx={{
          maxWidth: 280,
          minWidth: 240,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
          sx: {
            borderRadius: 1,
            backgroundColor: 'inherit',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e0e0e0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#d0d0d0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              borderWidth: 1,
            },
          },
        }}
      />

      {showViewToggle && onViewChange && (
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            backgroundColor: 'rgb(246, 247, 248)',
            borderRadius: '8px',
            padding: '4px',
          }}
        >
          <IconButton
            size="small"
            onClick={() => onViewChange('list')}
            sx={{
              color: currentView === 'list' ? 'primary.main' : 'text.secondary',
              backgroundColor: 'transparent',
              border: 'none',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'transparent',
              },
              '&:focus': {
                backgroundColor: 'transparent',
              },
              '&:active': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <FormatListIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onViewChange('grid')}
            sx={{
              color: currentView === 'grid' ? 'primary.main' : 'text.secondary',
              backgroundColor: 'transparent',
              border: 'none',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'transparent',
              },
              '&:focus': {
                backgroundColor: 'transparent',
              },
              '&:active': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <AppsIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};
