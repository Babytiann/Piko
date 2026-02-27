const store = new Map<string, unknown>();

export function get<T>(key: string): T | undefined {
  const value = store.get(key);
  return value as T | undefined;
}

export function set<T>(key: string, value: T): void {
  store.set(key, value);
}

export function clear(key?: string): void {
  if (key === undefined) {
    store.clear();
  } else {
    store.delete(key);
  }
}
