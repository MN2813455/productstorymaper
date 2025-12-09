import { StoryMapData, User } from '../types';

const STORAGE_KEY_MAPS = 'storymapper_maps';
const STORAGE_KEY_USER = 'storymapper_user';

export const storage = {
  getMaps: (): Record<string, StoryMapData> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MAPS);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  saveMap: (map: StoryMapData) => {
    const maps = storage.getMaps();
    maps[map.id] = { ...map, lastModified: Date.now() };
    localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(maps));
  },

  deleteMap: (id: string) => {
    const maps = storage.getMaps();
    delete maps[id];
    localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(maps));
  },

  getUser: (): User | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  login: (user: User) => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
};
