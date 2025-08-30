import { alpha, Box, Card, styled, Typography, Chip } from "@mui/material";
import { H3, H5 } from "components/Typography";
import { FC } from "react";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// root component interface
interface SaaSCardProps {
  card: any;
}

const StyledCard = styled(Card)(({ theme }) => ({
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(99, 102, 241, 0.08)",
  transition: "all 0.3s ease",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 40px rgba(99, 102, 241, 0.12)",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
  [theme.breakpoints.down("sm")]: {
    padding: "20px",
  },
}));

const SaaSCard: FC<SaaSCardProps> = ({ card }) => {
  const { Icon, title, color, price } = card;
  
  // Generate random percentage and trend for demo
  const percentage = Math.random() > 0.5 ? 
    `+${(Math.random() * 20 + 5).toFixed(1)}%` : 
    `-${(Math.random() * 10 + 1).toFixed(1)}%`;
  const isPositive = percentage.startsWith('+');

  return (
    <StyledCard>
      {/* Header with Icon and Trend */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: "flex",
            borderRadius: "12px",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(color, 0.1),
            border: `1px solid ${alpha(color, 0.2)}`,
          }}
        >
          <Icon sx={{ color, fontSize: "24px" }} />
        </Box>
        <Chip
          icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
          label={percentage}
          size="small"
          sx={{
            backgroundColor: isPositive ? alpha("#10B981", 0.1) : alpha("#EF4444", 0.1),
            color: isPositive ? "#10B981" : "#EF4444",
            border: `1px solid ${isPositive ? alpha("#10B981", 0.2) : alpha("#EF4444", 0.2)}`,
            fontWeight: 600,
            "& .MuiChip-icon": {
              color: "inherit",
              fontSize: "16px",
            },
          }}
        />
      </Box>

      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          fontWeight: 500,
          mb: 1,
          fontSize: "14px",
        }}
      >
        {title}
      </Typography>

      {/* Main Value */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: "text.primary",
          mb: 1,
          background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title.includes("Visitors") || title.includes("Clients") ? price.toLocaleString() : `$${price.toLocaleString()}`}
      </Typography>

      {/* Additional Info */}
      <Typography
        variant="caption"
        sx={{
          color: "text.disabled",
          fontSize: "12px",
        }}
      >
        vs last month
      </Typography>
    </StyledCard>
  );
};

export default SaaSCard;
