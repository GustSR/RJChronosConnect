import {
  Box,
  Avatar,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { H5, Small } from "components/Typography";
import { FC } from "react";
import ScrollBar from "simplebar-react";
import AnimatedCard from "components/common/AnimatedCard";
import {
  Router,
  Settings,
  Visibility,
  DeviceHub,
  Assignment,
  Person,
} from "@mui/icons-material";

const commonCSS = {
  minWidth: 120,
  "&:nth-of-type(2)": { minWidth: 200 },
  "&:nth-of-type(3)": { minWidth: 150 },
};

// Styled components
const HeadTableCell = styled(TableCell)(() => ({
  fontSize: 12,
  fontWeight: 600,
  "&:first-of-type": { paddingLeft: 0 },
  "&:last-of-type": { paddingRight: 0 },
}));

const BodyTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: 12,
  fontWeight: 500,
  padding: 0,
  paddingLeft: "1rem",
  paddingTop: "0.7rem",
  "&:first-of-type": { paddingLeft: 0 },
  "&:last-of-type": { paddingRight: 0 },
  [theme.breakpoints.down("sm")]: { ...commonCSS },
  [theme.breakpoints.between(960, 1270)]: { ...commonCSS },
}));

// Dados mockados para atividades dos usuários
const userActivities = [
  {
    id: 1,
    user: "João Silva",
    action: "Provisionou ONT",
    target: "Cliente: Maria Santos - ONT: ZTE-F670L",
    timestamp: "há 15 minutos",
    type: "provision"
  },
  {
    id: 2,
    user: "Ana Costa",
    action: "Alterou configuração",
    target: "OLT-CENTRO-01 - Perfil de velocidade",
    timestamp: "há 32 minutos", 
    type: "config"
  },
  {
    id: 3,
    user: "Carlos Mendes",
    action: "Visualizou relatório",
    target: "Relatório mensal de performance",
    timestamp: "há 1 hora",
    type: "view"
  },
  {
    id: 4,
    user: "Lucia Pereira",
    action: "Resetou ONT",
    target: "Cliente: Pedro Oliveira - ONT: Huawei HG8245H",
    timestamp: "há 2 horas",
    type: "reset"
  },
  {
    id: 5,
    user: "Roberto Lima",
    action: "Criou novo cliente",
    target: "Cliente: Empresa TechCorp LTDA",
    timestamp: "há 3 horas",
    type: "create"
  }
];

const getActionIcon = (type: string) => {
  const iconProps = { fontSize: "small" as const, sx: { color: "text.secondary" } };
  
  switch (type) {
    case "provision":
      return <Router {...iconProps} />;
    case "config":
      return <Settings {...iconProps} />;
    case "view":
      return <Visibility {...iconProps} />;
    case "reset":
      return <DeviceHub {...iconProps} />;
    case "create":
      return <Assignment {...iconProps} />;
    default:
      return <Person {...iconProps} />;
  }
};

const UserActivity: FC = () => {
  return (
    <AnimatedCard sx={{ padding: "2rem" }} delay={700}>
      <H5>Atividades Recentes dos Usuários</H5>

      <ScrollBar>
        <Table>
          <TableHead
            sx={{ borderBottom: "1.5px solid", borderColor: "divider" }}
          >
            <TableRow>
              <HeadTableCell>Usuário</HeadTableCell>
              <HeadTableCell>Ação</HeadTableCell>
              <HeadTableCell>Detalhes</HeadTableCell>
              <HeadTableCell>Tempo</HeadTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {userActivities.map((activity) => (
              <TableRow key={activity.id}>
                <BodyTableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ 
                      bgcolor: "action.hover", 
                      color: "text.secondary",
                      width: 32,
                      height: 32,
                      mr: 1
                    }}>
                      {getActionIcon(activity.type)}
                    </Avatar>
                    <Small fontWeight={600}>{activity.user}</Small>
                  </Box>
                </BodyTableCell>
                <BodyTableCell>
                  <Small>{activity.action}</Small>
                </BodyTableCell>
                <BodyTableCell>
                  <Small color="text.secondary">{activity.target}</Small>
                </BodyTableCell>
                <BodyTableCell>
                  <Small color="text.disabled">{activity.timestamp}</Small>
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
