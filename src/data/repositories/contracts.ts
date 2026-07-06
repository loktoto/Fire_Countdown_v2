export type EditableRepository<T> = {
  create(input: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  archive(id: string): Promise<void>;
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
};
