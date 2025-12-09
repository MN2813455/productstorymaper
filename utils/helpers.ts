import { StoryMapData } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const createEmptyMap = (): StoryMapData => {
  const actId = generateId();
  const taskId = generateId();
  return {
    id: generateId(),
    title: "Untitled Story Map",
    lastModified: Date.now(),
    activities: [
      {
        id: actId,
        title: "First Activity",
        tasks: [
          {
            id: taskId,
            title: "First Task",
            stories: []
          }
        ]
      }
    ],
    versions: []
  };
};