import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import type { ReactNode } from 'react';
import { FormField } from './FormField';

type Props = Omit<TextFieldProps, 'label'> & {
  label: ReactNode;
};

const defaultTextFieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

export function LabeledTextField({ label, sx, ...props }: Props) {
  return (
    <FormField label={label}>
      <TextField fullWidth size="small" {...props} sx={[defaultTextFieldSx, sx]} />
    </FormField>
  );
}

