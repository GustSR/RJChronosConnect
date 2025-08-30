import { Box, Card, Typography, LinearProgress, Rating } from "@mui/material";
import { H5 } from "components/Typography";
import { FC } from "react";
import { useTheme } from "@mui/material/styles";
import StarIcon from '@mui/icons-material/Star';

const RatingComponent: FC = () => {
  const theme = useTheme();

  const ratingData = [
    { stars: 5, percentage: 50, count: 325 },
    { stars: 4, percentage: 40, count: 260 },
    { stars: 3, percentage: 30, count: 195 },
    { stars: 2, percentage: 20, count: 130 },
    { stars: 1, percentage: 10, count: 65 },
  ];

  const totalReviews = ratingData.reduce((sum, item) => sum + item.count, 0);
  const averageRating = 4.5;

  return (
    <Card
      sx={{
        padding: "24px",
        height: "100%",
        background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.08)",
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
          <Rating
            value={5}
            readOnly
            sx={{
              "& .MuiRating-iconFilled": {
                color: "#F59E0B",
              },
            }}
          />
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 0.5,
          }}
        >
          {averageRating}/5
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total {totalReviews} customer review
        </Typography>
      </Box>

      {/* Rating Breakdown */}
      <Box>
        {ratingData.map((item) => (
          <Box key={item.stars} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="body2" sx={{ minWidth: "60px", color: "text.secondary" }}>
              {item.stars} Star
            </Typography>
            
            <Box sx={{ flex: 1, mx: 2 }}>
              <LinearProgress
                variant="determinate"
                value={item.percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: "40px", 
                textAlign: "right", 
                color: "text.secondary",
                fontWeight: 500 
              }}
            >
              {item.percentage}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default RatingComponent;