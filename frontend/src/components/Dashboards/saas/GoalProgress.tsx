import { Box, Card, Typography, LinearProgress } from "@mui/material";
import { FC } from "react";
import { useTheme } from "@mui/material/styles";

interface GoalData {
  title: string;
  current: number;
  target: number;
  color: string;
  prefix?: string;
}

interface GoalProgressProps {
  goals: GoalData[];
}

const GoalProgress: FC<GoalProgressProps> = ({ goals }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {goals.map((goal, index) => {
        const percentage = Math.round((goal.current / goal.target) * 100);
        
        return (
          <Card
            key={index}
            sx={{
              padding: "20px",
              flex: 1,
              background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(99, 102, 241, 0.08)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                backgroundColor: goal.color,
              },
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  mb: 0.5,
                }}
              >
                {goal.prefix || ""}{goal.current.toLocaleString()} to Goal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
                {percentage}%
              </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: goal.color,
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)`,
                  },
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                fontSize: "12px",
              }}
            >
              Target: {goal.prefix || ""}{goal.target.toLocaleString()}
            </Typography>
          </Card>
        );
      })}
    </Box>
  );
};

export default GoalProgress;