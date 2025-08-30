import React from 'react';
import useTitle from 'hooks/useTitle';
import KanbanBoard from '../components/common/KanbanBoard';

const Kanban: React.FC = () => {
  // change navbar title
  useTitle('Kanban - RJ Chronos');

  return <KanbanBoard />;
};

export default Kanban;