import { Box, Button, styled } from '@mui/material';
import FlexBox from '@shared/ui/components/FlexBox';
import SearchInput from '@shared/ui/components/SearchInput';
import UserListColumnShape from '@shared/ui/components/userManagement/columnShape';
import CustomTable from '@shared/ui/components/userManagement/CustomTable';
import { userListFakeData } from '@shared/ui/components/userManagement/fakeData';
import useTitle from '@shared/lib/hooks/useTitle';
import { FC } from 'react';
import { useNavigate } from 'react-router-dom';

// styled component
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

const UserList: FC = () => {
  // change navbar title
  useTitle('User List');

  const navigate = useNavigate();
  const handleAddUser = () => navigate('/dashboard/add-user');

  return (
    <Box pt={2} pb={4}>
      <StyledFlexBox>
        <SearchInput placeholder="Search user..." />
        <Button variant="contained" onClick={handleAddUser}>
          Add New User
        </Button>
      </StyledFlexBox>

      <CustomTable columnShape={UserListColumnShape} data={userListFakeData} />
    </Box>
  );
};

export default UserList;
