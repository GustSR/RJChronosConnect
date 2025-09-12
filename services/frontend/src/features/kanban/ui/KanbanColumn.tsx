import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import KanbanCard, { KanbanCardData } from './KanbanCard';

export interface KanbanColumnData {
  id: string;
  title: string;
  cards: KanbanCardData[];
}

interface KanbanColumnProps {
  column: KanbanColumnData;
  onAddCard?: (columnId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, onAddCard }) => {
  return (
    <Box
      sx={{
        minWidth: 320,
        maxWidth: 320,
        mr: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header da coluna */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '18px',
            color: '#1a1a1a',
            mb: 2,
          }}
        >
          {column.title}
        </Typography>

        {/* Botão Add para primeira coluna (To Do) */}
        {column.id === 'todo' && (
          <Button
            variant="contained"
            fullWidth
            startIcon={<Add />}
            onClick={() => onAddCard?.(column.id)}
            sx={{
              backgroundColor: '#6366f1',
              color: 'white',
              borderRadius: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#5855eb',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              },
            }}
          >
            Add Task
          </Button>
        )}
      </Box>

      {/* Área de drop */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flexGrow: 1,
              minHeight: 500,
              p: 2,
              backgroundColor: snapshot.isDraggingOver ? '#f8fafc' : '#fafbfc',
              border: snapshot.isDraggingOver
                ? '2px dashed #6366f1'
                : '2px dashed transparent',
              borderRadius: 3,
              transition: 'all 0.2s ease',
              boxShadow: 'none',
            }}
          >
            {/* Cards */}
            {column.cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}

            {/* Empty state */}
            {column.cards.length === 0 && !snapshot.isDraggingOver && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {column.id === 'todo'
                    ? 'Click "Add Task" to create a new task'
                    : 'Drop tasks here'}
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Droppable>
    </Box>
  );
};

export default KanbanColumn;
