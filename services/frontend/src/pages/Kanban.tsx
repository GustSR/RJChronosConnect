import React from 'react';
import { useTitle } from '@shared/lib/hooks';
import { KanbanBoard } from '@features/kanban/ui';

const Kanban: React.FC = () => {
  // change navbar title
  useTitle('Kanban - RJ Chronos');

  return <KanbanBoard />;
};

export default Kanban;
