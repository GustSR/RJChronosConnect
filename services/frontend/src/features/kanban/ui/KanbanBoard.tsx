import React, { useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Box, Container, Typography } from '@mui/material';
import KanbanColumn, { KanbanColumnData } from './KanbanColumn';
import { mockKanbanData, generateNewCard } from '__fakeData__/kanbanData';

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumnData[]>(mockKanbanData);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não houver destino, não faz nada
    if (!destination) {
      return;
    }

    // Se a posição não mudou, não faz nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Encontra as colunas de origem e destino
    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find(
      (col) => col.id === destination.droppableId
    );

    if (!sourceColumn || !destColumn) {
      return;
    }

    // Encontra o card que está sendo movido
    const movedCard = sourceColumn.cards.find(
      (card) => card.id === draggableId
    );
    if (!movedCard) {
      return;
    }

    // Cria novas colunas atualizadas
    const newColumns = columns.map((column) => {
      if (column.id === source.droppableId) {
        // Remove o card da coluna de origem
        return {
          ...column,
          cards: column.cards.filter((card) => card.id !== draggableId),
        };
      } else if (column.id === destination.droppableId) {
        // Adiciona o card na coluna de destino na posição correta
        const newCards = [...column.cards];
        newCards.splice(destination.index, 0, movedCard);
        return {
          ...column,
          cards: newCards,
        };
      } else {
        return column;
      }
    });

    setColumns(newColumns);
  };

  const handleAddCard = (columnId: string) => {
    const newCard = generateNewCard('New Task', 'Task');

    const newColumns = columns.map((column) => {
      if (column.id === columnId) {
        return {
          ...column,
          cards: [newCard, ...column.cards],
        };
      }
      return column;
    });

    setColumns(newColumns);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#fafbfc',
        py: 4,
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: '1400px' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: '28px',
              color: '#1a1a1a',
              mb: 1,
            }}
          >
            Project Management
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: '16px' }}
          >
            Manage your team's tasks and track progress with ease
          </Typography>
        </Box>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Box
            sx={{
              display: 'flex',
              gap: 0,
              overflowX: 'auto',
              pb: 2,
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f3f4',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#d0d4da',
                borderRadius: 4,
                '&:hover': {
                  backgroundColor: '#b8bcc2',
                },
              },
            }}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddCard={handleAddCard}
              />
            ))}
          </Box>
        </DragDropContext>
      </Container>
    </Box>
  );
};

export default KanbanBoard;
