const getStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn("Unable to access localStorage", error);
    }
    return null;
  }
};

export const TOKEN_STORAGE_KEY = "better-auth:token";
export const USER_STORAGE_KEY = "better-auth:user";

export const getStoredToken = (): string | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn("Failed to read auth token", error);
    }
    return null;
  }
};

export const setStoredToken = (token: string) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("Failed to persist auth token", error);
  }
};

export const clearStoredToken = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear auth token", error);
  }
};

export const saveStoredUser = (user: unknown) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to persist user", error);
  }
};

export const loadStoredUser = <T = unknown>(): T | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Failed to load stored user", error);
    return null;
  }
};

export const clearStoredUser = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear stored user", error);
  }
};
