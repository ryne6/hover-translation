export const getPrivate = <T>(instance: object, key: string): T =>
  Reflect.get(instance as Record<string, unknown>, key) as T;

export const setPrivate = (instance: object, key: string, value: unknown): void => {
  Reflect.set(instance as Record<string, unknown>, key, value);
};
