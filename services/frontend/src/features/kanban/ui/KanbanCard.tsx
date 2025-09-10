import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { MoreVert, AccessTime } from '@mui/icons-material';

export interface KanbanCardData {
  id: string;
  title: string;
  category: string;
  progress: number;
  dueDate: string;
  teamMembers: {
    id: string;
    name: string;
    avatar: string;
  }[];
  timeLeft: string;
}

interface KanbanCardProps {
  card: KanbanCardData;
  index: number;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ card, index }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: snapshot.isDragging
              ? '0 8px 32px rgba(0, 0, 0, 0.15)'
              : '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f0f0f0',
            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
            transition: 'all 0.2s ease',
            cursor: 'grab',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            },
            '&:active': {
              cursor: 'grabbing',
            },
          }}
        >
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            {/* Header com data e menu */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {card.dueDate}
              </Typography>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>

            {/* Título */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: 1.3,
                mb: 2,
                color: '#1a1a1a',
              }}
            >
              {card.title}
            </Typography>

            {/* Categoria */}
            <Chip
              label={card.category}
              size="small"
              sx={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '12px',
                fontWeight: 500,
                mb: 3,
                '& .MuiChip-label': {
                  px: 1.5,
                  py: 0.5,
                },
              }}
            />

            {/* Progress */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontSize="13px"
                >
                  Project Progress
                </Typography>
                <Typography variant="body2" fontWeight="600" fontSize="13px">
                  {card.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={card.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#6366f1',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            {/* Footer com avatars e time left */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <AvatarGroup
                max={3}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    fontSize: '12px',
                    border: '2px solid white',
                    marginLeft: -1,
                  },
                }}
              >
                {card.teamMembers.map((member) => (
                  <Avatar
                    key={member.id}
                    src={member.avatar}
                    alt={member.name}
                    sx={{ bgcolor: '#6366f1' }}
                  >
                    {member.name.charAt(0)}
                  </Avatar>
                ))}
              </AvatarGroup>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'text.secondary',
                }}
              >
                <AccessTime
                  fontSize="small"
                  sx={{ mr: 0.5, fontSize: '16px' }}
                />
                <Typography variant="caption" fontSize="12px">
                  {card.timeLeft}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default KanbanCard;
