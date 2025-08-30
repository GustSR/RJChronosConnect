import {
  Box,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { H5 } from "components/Typography";
import { FC } from "react";
import ScrollBar from "simplebar-react";
import AnimatedCard from "components/common/AnimatedCard";
import { DeviceHub } from "@mui/icons-material";

const commonCSS = {
  minWidth: 120,
  "&:nth-of-type(2)": { minWidth: 170 },
  "&:nth-of-type(3)": { minWidth: 80 },
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

// Dados mockados para Grid de OLTs
const oltGridData = [
  {
    id: 1,
    oltName: "OLT-CENTRO-01",
    totalOnts: 324,
    onlineOnts: 298,
    offlineOnts: 26,
    status: "online",
    lastIssue: "Nenhum problema",
    uptime: "15d 8h"
  },
  {
    id: 2,
    oltName: "OLT-BAIRRO-02",
    totalOnts: 256,
    onlineOnts: 231,
    offlineOnts: 25,
    status: "warning",
    lastIssue: "Fibra cortada",
    uptime: "2d 14h"
  },
  {
    id: 3,
    oltName: "OLT-INDUSTRIAL-03",
    totalOnts: 189,
    onlineOnts: 175,
    offlineOnts: 14,
    status: "online",
    lastIssue: "Nenhum problema",
    uptime: "45d 2h"
  },
  {
    id: 4,
    oltName: "OLT-RESIDENCIAL-04",
    totalOnts: 412,
    onlineOnts: 387,
    offlineOnts: 25,
    status: "critical",
    lastIssue: "Falta de energia",
    uptime: "0d 6h"
  },
];

const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "online":
      return "success";
    case "warning":
      return "warning";
    case "critical":
      return "error";
    default:
      return "default";
  }
};

const OLTGrid: FC = () => {
  return (
    <AnimatedCard sx={{ padding: "2rem" }} delay={800}>
      <H5>Status das OLTs</H5>

      <ScrollBar>
        <Table>
          <TableHead
            sx={{ borderBottom: "1.5px solid", borderColor: "divider" }}
          >
            <TableRow>
              <HeadTableCell>OLT</HeadTableCell>
              <HeadTableCell align="center">Total ONTs</HeadTableCell>
              <HeadTableCell align="center">Online</HeadTableCell>
              <HeadTableCell align="center">Offline</HeadTableCell>
              <HeadTableCell align="center">Status</HeadTableCell>
              <HeadTableCell>Último Problema</HeadTableCell>
              <HeadTableCell align="center">Uptime</HeadTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {oltGridData.map((olt) => (
              <TableRow key={olt.id}>
                <BodyTableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <DeviceHub sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />
                    {olt.oltName}
                  </Box>
                </BodyTableCell>
                <BodyTableCell align="center">{olt.totalOnts}</BodyTableCell>
                <BodyTableCell align="center">
                  <Box sx={{ color: "success.main", fontWeight: 600 }}>
                    {olt.onlineOnts}
                  </Box>
                </BodyTableCell>
                <BodyTableCell align="center">
                  <Box sx={{ color: "error.main", fontWeight: 600 }}>
                    {olt.offlineOnts}
                  </Box>
                </BodyTableCell>
                <BodyTableCell align="center">
                  <Chip
                    label={olt.status.toUpperCase()}
                    color={getStatusColor(olt.status)}
                    size="small"
                    sx={{ fontSize: 10 }}
                  />
                </BodyTableCell>
                <BodyTableCell>{olt.lastIssue}</BodyTableCell>
                <BodyTableCell align="center">{olt.uptime}</BodyTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollBar>
    </AnimatedCard>
  );
};

export default OLTGrid;
