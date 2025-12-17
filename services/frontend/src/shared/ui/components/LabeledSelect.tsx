import { FormControl, Select } from '@mui/material';
import type { SelectProps } from '@mui/material';
import type { ReactNode } from 'react';
import { FormField } from './FormField';

type Props<T> = Omit<SelectProps<T>, 'label'> & {
  label: ReactNode;
};

export function LabeledSelect<T>({ label, MenuProps, sx, ...props }: Props<T>) {
  return (
    <FormField label={label}>
      <FormControl fullWidth size="small">
        <Select
          {...props}
          sx={[{ borderRadius: 2 }, sx]}
          MenuProps={{ disableScrollLock: true, ...MenuProps }}
        />
      </FormControl>
    </FormField>
  );
}

