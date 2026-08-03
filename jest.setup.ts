// Keep Expo SQLite's native localStorage installer out of the Node/Jest runtime.
// Production still imports the real installer from src/data/fireStore.tsx.
jest.mock("expo-sqlite/localStorage/install", () => ({}));

const storageState = new Map<string, string>();

const memoryLocalStorage: Storage = {
  get length() {
    return storageState.size;
  },
  clear() {
    storageState.clear();
  },
  getItem(key: string) {
    return storageState.get(key) ?? null;
  },
  key(index: number) {
    return Array.from(storageState.keys())[index] ?? null;
  },
  removeItem(key: string) {
    storageState.delete(key);
  },
  setItem(key: string, value: string) {
    storageState.set(key, String(value));
  },
};

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: memoryLocalStorage,
});

beforeEach(() => {
  storageState.clear();
});
