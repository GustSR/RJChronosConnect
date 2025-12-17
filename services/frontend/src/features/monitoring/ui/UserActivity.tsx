import { Box, Avatar, styled, Table, TableBody, TableCell, TableHead, TableRow, Skeleton, Alert } from '@mui/material';
import { H5, Small } from '@shared/ui/components/Typography';
import { FC } from 'react';
import ScrollBar from 'simplebar-react';
import { AnimatedCard } from '@shared/ui/components';
import { Router, Settings, Visibility, DeviceHub, Assignment, Person } from '@mui/icons-material';
import { useActivityLogs } from '../model';

const commonCSS = {
  minWidth: 120,
  '&:nth-of-type(2)': { minWidth: 200 },
  '&:nth-of-type(3)': { minWidth: 150 },
};

// Styled components
const HeadTableCell = styled(TableCell)(() => ({
  fontSize: 12,
  fontWeight: 600,
  '&:first-of-type': { paddingLeft: 0 },
  '&:last-of-type': { paddingRight: 0 },
}));

const BodyTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: 12,
  fontWeight: 500,
  padding: 0,
  paddingLeft: '1rem',
  paddingTop: '0.7rem',
  '&:first-of-type': { paddingLeft: 0 },
  '&:last-of-type': { paddingRight: 0 },
  [theme.breakpoints.down('sm')]: { ...commonCSS },
  [theme.breakpoints.between(960, 1270)]: { ...commonCSS },
}));

// Dados mockados para atividades dos usuários
const getActionIcon = (actionType: string) => {
  const iconProps = {
    fontSize: 'small' as const,
    sx: { color: 'text.secondary' },
  };

  if (actionType.includes('provision') || actionType.includes('Provisionou')) {
    return <Router {...iconProps} />;
  }
  if (actionType.includes('config') || actionType.includes('Alterou')) {
    return <Settings {...iconProps} />;
  }
  if (actionType.includes('view') || actionType.includes('Visualizou')) {
    return <Visibility {...iconProps} />;
  }
  if (actionType.includes('reset') || actionType.includes('Resetou')) {
    return <DeviceHub {...iconProps} />;
  }
  if (actionType.includes('create') || actionType.includes('Criou')) {
    return <Assignment {...iconProps} />;
  }
  return <Person {...iconProps} />;
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const activityDate = new Date(dateString);
  const diffInMinutes = Math.floor(
    (now.getTime() - activityDate.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} minutos`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
};

const UserActivity: FC = () => {
  const { activities, loading, error } = useActivityLogs({ limit: 5 });

  // Loading state
  if (loading) {
    return (
      <AnimatedCard
        sx={{
          padding: '2rem',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}
        delay={700}
      >
        <H5>Atividades Recentes dos Usuários</H5>
        <ScrollBar style={{ flex: 1, maxHeight: '520px' }}>
          <Table>
            <TableHead
              sx={{ borderBottom: '1.5px solid', borderColor: 'divider' }}
            >
              <TableRow>
                <HeadTableCell>Usuário</HeadTableCell>
                <HeadTableCell>Ação</HeadTableCell>
                <HeadTableCell>Detalhes</HeadTableCell>
                <HeadTableCell>Tempo</HeadTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((index) => (
                <TableRow key={index}>
                  <BodyTableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Skeleton
                        variant="circular"
                        width={32}
                        height={32}
                        sx={{ mr: 1 }}
                      />
                      <Skeleton width={80} height={20} />
                    </Box>
                  </BodyTableCell>
                  <BodyTableCell>
                    <Skeleton width={100} height={20} />
                  </BodyTableCell>
                  <BodyTableCell>
                    <Skeleton width={150} height={20} />
                  </BodyTableCell>
                  <BodyTableCell>
                    <Skeleton width={60} height={20} />
                  </BodyTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollBar>
      </AnimatedCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AnimatedCard
        sx={{
          padding: '2rem',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}
        delay={700}
      >
        <H5>Atividades Recentes dos Usuários</H5>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error} - Dados em cache não disponíveis
        </Alert>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard
      sx={{
        padding: '2rem',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'none',
          boxShadow:
            '0px 2px 1px -1px rgba(107, 114, 128, 0.03), 0px 1px 1px 0px rgba(107, 114, 128, 0.04), 0px 1px 3px 0px rgba(107, 114, 128, 0.08)',
        },
      }}
      delay={700}
    >
      <H5>Atividades Recentes dos Usuários</H5>

      <ScrollBar style={{ flex: 1, maxHeight: '520px' }}>
        <Table>
          <TableHead
            sx={{ borderBottom: '1.5px solid', borderColor: 'divider' }}
          >
            <TableRow>
              <HeadTableCell>Usuário</HeadTableCell>
              <HeadTableCell>Ação</HeadTableCell>
              <HeadTableCell>Detalhes</HeadTableCell>
              <HeadTableCell>Tempo</HeadTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <BodyTableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        width: 32,
                        height: 32,
                        mr: 1,
                      }}
                    >
                      {getActionIcon(activity.action)}
                    </Avatar>
                    <Small fontWeight={600}>
                      {activity.user_name || 'Sistema'}
                    </Small>
                  </Box>
                </BodyTableCell>
                <BodyTableCell>
                  <Small>{activity.action}</Small>
                </BodyTableCell>
                <BodyTableCell>
                  <Small color="text.secondary">{activity.description}</Small>
                </BodyTableCell>
                <BodyTableCell>
                  <Small color="text.disabled">
                    {formatTimeAgo(activity.created_at)}
                  </Small>
                </BodyTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollBar>
    </AnimatedCard>
  );
};

export default UserActivity;
