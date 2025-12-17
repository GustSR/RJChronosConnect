import { Box, Button, Grid, styled } from '@mui/material';
import FlexBox from '@shared/ui/components/FlexBox';
import SearchInput from '@shared/ui/components/SearchInput';
import type { FC } from 'react';
import { userGridFakeData } from '../model';
import { UserCard } from './components';

type Props = {
  onAddUser: () => void;
};

const StyledFlexBox = styled(FlexBox)(({ theme }) => ({
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 20,
  [theme.breakpoints.down(500)]: {
    width: '100%',
    '& .MuiInputBase-root': { maxWidth: '100%' },
    '& .MuiButton-root': {
      width: '100%',
      marginTop: 15,
    },
  },
}));

export const UserGridPage: FC<Props> = ({ onAddUser }) => {
  return (
    <Box pt={2} pb={4}>
      <StyledFlexBox>
        <SearchInput placeholder="Search user..." />
        <Button variant="contained" onClick={onAddUser}>
          Add New User
        </Button>
      </StyledFlexBox>

      <Grid container spacing={3}>
        {userGridFakeData.map((user, index) => (
          <Grid item md={4} sm={6} xs={12} key={index}>
            <UserCard user={user} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

