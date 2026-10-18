/** Returns a copy of the item with a new unique id. */
export function withId<T extends object>(item: T): T & { id: string } {
  return { ...item, id: crypto.randomUUID() };
}
