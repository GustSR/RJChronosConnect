import { KanbanColumnData } from '@features/kanban/ui/KanbanColumn';

export const mockKanbanData: KanbanColumnData[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      {
        id: 'card-1',
        title: 'Create Minimal Logo',
        category: 'Prototyping',
        progress: 32,
        dueDate: 'Sep 17, 2021',
        teamMembers: [
          {
            id: 'user-1',
            name: 'John Doe',
            avatar: '/static/images/avatars/avatar_1.jpg',
          },
          {
            id: 'user-2',
            name: 'Jane Smith',
            avatar: '/static/images/avatars/avatar_2.jpg',
          },
          {
            id: 'user-3',
            name: 'Mike Johnson',
            avatar: '/static/images/avatars/avatar_3.jpg',
          },
        ],
        timeLeft: '3 Weeks Left',
      },
      {
        id: 'card-2',
        title: 'Therapy Session',
        category: 'Prototyping',
        progress: 32,
        dueDate: 'Sep 17, 2021',
        teamMembers: [
          {
            id: 'user-4',
            name: 'Sarah Wilson',
            avatar: '/static/images/avatars/avatar_4.jpg',
          },
          {
            id: 'user-5',
            name: 'Tom Brown',
            avatar: '/static/images/avatars/avatar_5.jpg',
          },
        ],
        timeLeft: '3 Weeks Left',
      },
    ],
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    cards: [
      {
        id: 'card-3',
        title: 'Create Minimal Logo',
        category: 'Prototyping',
        progress: 32,
        dueDate: 'Sep 17, 2021',
        teamMembers: [
          {
            id: 'user-6',
            name: 'Alice Green',
            avatar: '/static/images/avatars/avatar_6.jpg',
          },
          {
            id: 'user-7',
            name: 'Bob Davis',
            avatar: '/static/images/avatars/avatar_7.jpg',
          },
        ],
        timeLeft: '3 Weeks Left',
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      {
        id: 'card-4',
        title: 'Website UI Design',
        category: 'Prototyping',
        progress: 32,
        dueDate: 'Sep 17, 2021',
        teamMembers: [
          {
            id: 'user-8',
            name: 'Emma White',
            avatar: '/static/images/avatars/avatar_8.jpg',
          },
          {
            id: 'user-9',
            name: 'Chris Lee',
            avatar: '/static/images/avatars/avatar_9.jpg',
          },
        ],
        timeLeft: '3 Weeks Left',
      },
    ],
  },
];

export const generateNewCard = (
  title: string,
  category: string = 'New Task'
) => ({
  id: `card-${Date.now()}`,
  title,
  category,
  progress: 0,
  dueDate: new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
  teamMembers: [
    {
      id: `user-${Date.now()}`,
      name: 'New User',
      avatar: '/static/images/avatars/avatar_1.jpg',
    },
  ],
  timeLeft: 'Just Created',
});
