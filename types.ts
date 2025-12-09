
export enum ReleaseGroup {
  MVP = "MVP",
  Release1 = "Release 1",
  Release2 = "Release 2",
  Future = "Future Considerations"
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  releaseGroup: ReleaseGroup;
  points?: number;
  color?: string; // New: 'red', 'blue', 'green', etc.
}

export interface Task {
  // Maps to "Feature" in UI
  id: string;
  title: string;
  stories: Story[];
}

export interface Activity {
  // Maps to "Epic" in UI
  id: string;
  title: string;
  tasks: Task[];
}

export interface Version {
  id: string;
  name: string;
  timestamp: number;
  data: Omit<StoryMapData, 'versions'>;
}

export interface StoryMapData {
  id: string;
  title: string;
  okr?: string; // Strategic Goal / OKR
  lastModified: number;
  activities: Activity[];
  versions: Version[];
}

export interface User {
  email: string;
  name: string;
}
